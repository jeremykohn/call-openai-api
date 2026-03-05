import { afterAll, describe, expect, it, beforeEach } from "vitest";
import { $fetch, setup } from "@nuxt/test-utils";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { DEFAULT_MODEL } from "../../shared/constants/models";
const rootDir = fileURLToPath(new URL("../..", import.meta.url));
process.env.OPENAI_API_KEY = "test-key";

let mockStatus = 200;
let mockBody: unknown = { output_text: "Hello from OpenAI" };
let lastRequestBody: unknown = null;

const mockServer = createServer((request, response) => {
  // Collect request body
  let body = "";
  request.on("data", (chunk) => {
    body += chunk.toString();
  });

  request.on("end", () => {
    if (request.url === "/models") {
      // Return mock models list
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          data: [
            { id: "gpt-4", created: 1686935002, owned_by: "openai" },
            { id: "gpt-3.5-turbo", created: 1686935002, owned_by: "openai" },
            { id: DEFAULT_MODEL, created: 1686935002, owned_by: "openai" },
          ],
        }),
      );
      return;
    }

    if (request.url === "/responses") {
      // Capture request body for assertions
      if (body) {
        try {
          lastRequestBody = JSON.parse(body);
        } catch {
          lastRequestBody = null;
        }
      }

      response.statusCode = mockStatus;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(mockBody));
      return;
    }

    response.statusCode = 404;
    response.end();
  });
});

const mockPort = await new Promise<number>((resolve) => {
  mockServer.listen(0, "127.0.0.1", () => {
    const address = mockServer.address() as AddressInfo;
    resolve(address.port);
  });
});

process.env.OPENAI_BASE_URL = `http://127.0.0.1:${mockPort}`;
process.env.OPENAI_ALLOWED_HOSTS = "127.0.0.1";

await setup({ rootDir, dev: true });

afterAll(() => {
  mockServer.close();
});

describe("POST /api/respond", () => {
  beforeEach(() => {
    lastRequestBody = null;
  });
  it("returns 400 for invalid prompt", async () => {
    try {
      await $fetch("/api/respond", {
        method: "POST",
        body: { prompt: "   " },
      });
      throw new Error("Expected request to fail");
    } catch (error) {
      const fetchError = error as {
        statusCode?: number;
        status?: number;
        statusMessage?: string;
        data?: { message?: string };
      };

      const message = fetchError.data?.message ?? fetchError.statusMessage;

      expect(message).toBe("Please enter a prompt.");
      expect(fetchError.statusCode ?? fetchError.status).toBe(400);
    }
  });

  it("returns response text on success", async () => {
    mockStatus = 200;
    mockBody = { output_text: "Hello from OpenAI" };

    const result = await $fetch("/api/respond", {
      method: "POST",
      body: { prompt: "Hello" },
    });

    expect(result).toEqual({
      response: "Hello from OpenAI",
      model: DEFAULT_MODEL,
    });
  });

  it("returns API error details when upstream fails", async () => {
    mockStatus = 401;
    mockBody = { error: { message: "Invalid API key" } };

    try {
      await $fetch("/api/respond", {
        method: "POST",
        body: { prompt: "Hello" },
      });
      throw new Error("Expected request to fail");
    } catch (error) {
      const fetchError = error as {
        statusCode?: number;
        status?: number;
        statusMessage?: string;
        data?: { message?: string; details?: string };
      };

      const message = fetchError.data?.message ?? fetchError.statusMessage;

      expect(message).toBe("Request to OpenAI failed.");
      expect(fetchError.data?.details).toContain("Invalid API key");
      expect(fetchError.data?.details).toContain("status: 401");
      expect(fetchError.statusCode ?? fetchError.status).toBe(401);
    }
  });

  it("includes selected model in upstream OpenAI request", async () => {
    mockStatus = 200;
    mockBody = { output_text: "Response with model" };

    const result = await $fetch("/api/respond", {
      method: "POST",
      body: { prompt: "Hello", model: "gpt-4" },
    });

    // Verify response includes the model that was used
    expect(result).toEqual({
      response: "Response with model",
      model: "gpt-4",
    });

    // Verify the OpenAI request included the selected model
    expect(lastRequestBody).toBeDefined();
    expect((lastRequestBody as any).model).toBe("gpt-4");
  });

  it("includes default model in upstream OpenAI request when no model selected", async () => {
    mockStatus = 200;
    mockBody = { output_text: "Response with default" };

    const result = await $fetch("/api/respond", {
      method: "POST",
      body: { prompt: "Hello" },
    });

    // Verify response includes the default model
    expect(result).toEqual({
      response: "Response with default",
      model: DEFAULT_MODEL,
    });

    // Verify the OpenAI request included the default model
    expect(lastRequestBody).toBeDefined();
    expect((lastRequestBody as any).model).toBe(DEFAULT_MODEL);
  });

  it("includes model in successful response payload", async () => {
    mockStatus = 200;
    mockBody = { output_text: "Test output" };

    const result = await $fetch("/api/respond", {
      method: "POST",
      body: { prompt: "Test", model: "gpt-3.5-turbo" },
    });

    // Verify response includes model field
    expect(result).toHaveProperty("response");
    expect(result).toHaveProperty("model");
    expect((result as any).model).toBe("gpt-3.5-turbo");
  });
});
