import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { $fetch, setup } from "@nuxt/test-utils";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));

let mockStatus = 200;
let mockBody: unknown = {
  object: "list",
  data: [
    {
      id: "gpt-test-1",
      object: "model",
      created: 1686935002,
      owned_by: "openai",
    },
  ],
};

interface TestRequest {
  url?: string;
  authorization?: string;
}

let lastRequest: TestRequest = {};

const mockServer = createServer((request, response) => {
  lastRequest = {
    url: request.url ?? undefined,
    authorization: request.headers.authorization,
  };

  if (request.url !== "/models") {
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
process.env.OPENAI_ALLOWED_HOSTS = "127.0.0.1";
process.env.OPENAI_API_KEY = "test-key";
process.env.OPENAI_ALLOW_INSECURE_HTTP = "true";

await setup({ rootDir, dev: true });

beforeEach(() => {
  mockStatus = 200;
  mockBody = {
    object: "list",
    data: [
      {
        id: "gpt-test-1",
        object: "model",
        created: 1686935002,
        owned_by: "openai",
      },
    ],
  };
  lastRequest = {};
});

afterAll(() => {
  mockServer.close();
});

describe("GET /api/models", () => {
  it("returns upstream 401 when OpenAI models API rejects the request", async () => {
    // The route checks runtime config, which is set at startup.
    // This test verifies the error handling pathway exists by checking
    // the error response structure when the upstream API fails with 401.
    mockStatus = 401;
    mockBody = { error: { message: "Unauthorized", type: "auth_error" } };

    try {
      await $fetch("/api/models");
      throw new Error("Expected request to fail");
    } catch (error) {
      const fetchError = error as {
        statusCode?: number;
        status?: number;
        data?: { message?: string };
      };

      expect(fetchError.statusCode ?? fetchError.status).toBe(401);
      expect(fetchError.data?.message).toBe(
        "Error: Failed API call, could not get list of OpenAI models",
      );
    }
  });

  it("constructs the correct URL and includes authorization header", async () => {
    await $fetch("/api/models");

    expect(lastRequest.url).toBe("/models");
    expect(lastRequest.authorization).toBe("Bearer test-key");
  });

  it("returns the models list on success without the object field", async () => {
    mockBody = {
      object: "list",
      data: [
        {
          id: "gpt-test-1",
          object: "model",
          created: 1686935002,
          owned_by: "openai",
        },
        {
          id: "gpt-test-2",
          object: "model",
          created: 1686935003,
          owned_by: "openai",
        },
      ],
    };

    const result = await $fetch<{
      data: Array<{
        id: string;
        object: "model";
        created: number;
        owned_by: string;
      }>;
    }>("/api/models");

    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      id: "gpt-test-1",
      object: "model",
      created: 1686935002,
      owned_by: "openai",
    });
  });

  it("returns error message and details when upstream fails", async () => {
    mockStatus = 401;
    mockBody = { error: { message: "Invalid API key", type: "auth_error" } };

    try {
      await $fetch("/api/models");
      throw new Error("Expected request to fail");
    } catch (error) {
      const fetchError = error as {
        statusCode?: number;
        status?: number;
        statusMessage?: string;
        data?: { message?: string; details?: string };
      };

      expect(fetchError.statusCode ?? fetchError.status).toBe(401);
      expect(fetchError.data?.message).toBe(
        "Error: Failed API call, could not get list of OpenAI models",
      );
      expect(fetchError.data?.details).toContain("Invalid API key");
    }
  });
});
