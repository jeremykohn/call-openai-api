import { afterAll, describe, expect, it } from "vitest";
import { $fetch, setup } from "@nuxt/test-utils";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
const rootDir = fileURLToPath(new URL("../..", import.meta.url));
process.env.OPENAI_API_KEY = "test-key";

let mockStatus = 200;
let mockBody: unknown = { output_text: "Hello from OpenAI" };

const mockServer = createServer((request, response) => {
  if (request.url !== "/responses") {
    response.statusCode = 404;
    response.end();
    return;
  }

  response.statusCode = mockStatus;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(mockBody));
});

const mockPort = await new Promise<number>((resolve) => {
  mockServer.listen(0, "127.0.0.1", () => {
    const address = mockServer.address() as AddressInfo;
    resolve(address.port);
  });
});

process.env.OPENAI_BASE_URL = `http://127.0.0.1:${mockPort}`;

await setup({ rootDir, dev: true });

afterAll(() => {
  mockServer.close();
});

describe("POST /api/respond", () => {

  it("returns 400 for invalid prompt", async () => {
    try {
      await $fetch("/api/respond", {
        method: "POST",
        body: { prompt: "   " }
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
      body: { prompt: "Hello" }
    });

    expect(result).toEqual({ response: "Hello from OpenAI" });
  });

  it("returns API error details when upstream fails", async () => {
    mockStatus = 401;
    mockBody = { error: { message: "Invalid API key" } };

    try {
      await $fetch("/api/respond", {
        method: "POST",
        body: { prompt: "Hello" }
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
});
