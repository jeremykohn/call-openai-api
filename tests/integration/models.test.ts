import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { $fetch, setup } from "@nuxt/test-utils";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { rm, writeFile } from "node:fs/promises";
import { captureEnvVars, ENV_KEYS } from "./helpers/env-restore";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
const configFilePath = fileURLToPath(
  new URL("../../server/assets/models/openai-models.json", import.meta.url),
);
const defaultConfigFileContent = JSON.stringify(
  {
    "available-models": [],
    "models-with-error": ["beta-model"],
    "models-with-no-response": [],
    "other-models": [],
  },
  null,
  2,
);

// Must be captured before any process.env mutations below.
const env = captureEnvVars([...ENV_KEYS]);

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
let mockRawBody: string | null = null;
let simulateModelsNetworkError = false;
let modelsRequestCount = 0;
let responsesRequestCount = 0;

const resetMockServerState = (): void => {
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
  mockRawBody = null;
  simulateModelsNetworkError = false;
  modelsRequestCount = 0;
  responsesRequestCount = 0;
};

interface TestRequest {
  url?: string;
  authorization?: string;
}

let lastModelsRequest: TestRequest = {};

const mockServer = createServer((request, response) => {
  if (request.url === "/models") {
    modelsRequestCount += 1;
    lastModelsRequest = {
      url: request.url ?? undefined,
      authorization: request.headers.authorization,
    };

    if (simulateModelsNetworkError) {
      response.destroy(new Error("Simulated upstream models connection reset"));
      return;
    }

    response.statusCode = mockStatus;
    response.setHeader("Content-Type", "application/json");
    response.end(mockRawBody ?? JSON.stringify(mockBody));
    return;
  }

  if (request.url === "/responses" && request.method === "POST") {
    responsesRequestCount += 1;
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ id: "probe-ok" }));
    return;
  }

  if (!request.url) {
    response.statusCode = 404;
    response.end();
    return;
  }

  response.statusCode = 404;
  response.end();
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
process.env.OPENAI_DISABLE_MODELS_CACHE = "true";

await setup({ rootDir, dev: true });

beforeEach(() => {
  resetMockServerState();
});

afterAll(async () => {
  await writeFile(configFilePath, `${defaultConfigFileContent}\n`, "utf-8");
  mockServer.close();
  env.restoreAll();
});

const removeConfigFileIfPresent = async (): Promise<void> => {
  await rm(configFilePath, { force: true });
};

const writeConfigFile = async (content: string): Promise<void> => {
  await writeFile(configFilePath, content, "utf-8");
};

describe("GET /api/models", () => {
  beforeEach(async () => {
    await removeConfigFileIfPresent();
  });

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

    expect(modelsRequestCount).toBeGreaterThan(0);
    expect(lastModelsRequest.url).toBe("/models");
    expect(lastModelsRequest.authorization).toBe("Bearer test-key");
  });

  it("returns all upstream models in alphabetical order when config is missing", async () => {
    mockBody = {
      object: "list",
      data: [
        {
          id: "z-model",
          object: "model",
          created: 1686935002,
          owned_by: "openai",
        },
        {
          id: "a-model",
          object: "model",
          created: 1686935003,
          owned_by: "openai",
        },
        {
          id: "m-model",
          object: "model",
          created: 1686935004,
          owned_by: "openai",
        },
      ],
    };

    const result = await $fetch<{
      object: "list";
      data: Array<{
        id: string;
        object: "model";
        created: number;
        owned_by: string;
      }>;
      usedConfigFilter: boolean;
      showFallbackNote: boolean;
    }>("/api/models");

    expect(result.object).toBe("list");
    expect(result.data).toHaveLength(3);
    expect(result.data.map((model) => model.id)).toEqual([
      "a-model",
      "m-model",
      "z-model",
    ]);
    expect(result.usedConfigFilter).toBe(false);
    expect(result.showFallbackNote).toBe(true);
  });

  it("filters models listed in config and returns non-fallback metadata", async () => {
    await writeConfigFile(
      JSON.stringify(
        {
          "available-models": ["gpt-extra"],
          "models-with-error": ["gpt-image-1.5"],
          "models-with-no-response": ["gpt-test-1"],
          "other-models": ["gpt-extra"],
        },
        null,
        2,
      ),
    );

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
          id: "gpt-image-1.5",
          object: "model",
          created: 1686935003,
          owned_by: "openai",
        },
      ],
    };

    const result = await $fetch<{
      object: "list";
      data: Array<{
        id: string;
      }>;
      usedConfigFilter: boolean;
      showFallbackNote: boolean;
    }>("/api/models");

    expect(result.object).toBe("list");
    expect(result.data.map((model) => model.id)).toEqual([]);
    expect(result.usedConfigFilter).toBe(true);
    expect(result.showFallbackNote).toBe(false);
  });

  it("does not exclude models that appear only in available-models", async () => {
    await writeConfigFile(
      JSON.stringify(
        {
          "available-models": ["gpt-test-1"],
          "models-with-error": [],
          "models-with-no-response": [],
          "other-models": [],
        },
        null,
        2,
      ),
    );

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
      data: Array<{ id: string }>;
      usedConfigFilter: boolean;
      showFallbackNote: boolean;
    }>("/api/models");

    expect(result.data.map((model) => model.id)).toEqual([
      "gpt-test-1",
      "gpt-test-2",
    ]);
    expect(result.usedConfigFilter).toBe(true);
    expect(result.showFallbackNote).toBe(false);
  });

  it("does not exclude models that appear only in other-models", async () => {
    await writeConfigFile(
      JSON.stringify(
        {
          "available-models": [],
          "models-with-error": [],
          "models-with-no-response": [],
          "other-models": ["gpt-test-1"],
        },
        null,
        2,
      ),
    );

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
      data: Array<{ id: string }>;
      usedConfigFilter: boolean;
      showFallbackNote: boolean;
    }>("/api/models");

    expect(result.data.map((model) => model.id)).toEqual([
      "gpt-test-1",
      "gpt-test-2",
    ]);
    expect(result.usedConfigFilter).toBe(true);
    expect(result.showFallbackNote).toBe(false);
  });

  it("excludes only models in models-with-error and models-with-no-response", async () => {
    await writeConfigFile(
      JSON.stringify(
        {
          "available-models": ["model-a"],
          "models-with-error": ["model-b"],
          "models-with-no-response": ["model-c"],
          "other-models": ["model-d"],
        },
        null,
        2,
      ),
    );

    mockBody = {
      object: "list",
      data: [
        {
          id: "model-a",
          object: "model",
          created: 1686935001,
          owned_by: "openai",
        },
        {
          id: "model-b",
          object: "model",
          created: 1686935002,
          owned_by: "openai",
        },
        {
          id: "model-c",
          object: "model",
          created: 1686935003,
          owned_by: "openai",
        },
        {
          id: "model-d",
          object: "model",
          created: 1686935004,
          owned_by: "openai",
        },
      ],
    };

    const result = await $fetch<{
      data: Array<{ id: string }>;
      usedConfigFilter: boolean;
      showFallbackNote: boolean;
    }>("/api/models");

    expect(result.data.map((model) => model.id)).toEqual([
      "model-a",
      "model-d",
    ]);
    expect(result.usedConfigFilter).toBe(true);
    expect(result.showFallbackNote).toBe(false);
  });

  it("falls back to full alphabetical list when config JSON is malformed", async () => {
    await writeConfigFile("{ malformed json");

    mockBody = {
      object: "list",
      data: [
        {
          id: "model-b",
          object: "model",
          created: 1686935002,
          owned_by: "openai",
        },
        {
          id: "model-a",
          object: "model",
          created: 1686935003,
          owned_by: "openai",
        },
      ],
    };

    const result = await $fetch<{
      object: "list";
      data: Array<{ id: string }>;
      usedConfigFilter: boolean;
      showFallbackNote: boolean;
    }>("/api/models");

    expect(result.data.map((model) => model.id)).toEqual([
      "model-a",
      "model-b",
    ]);
    expect(result.usedConfigFilter).toBe(false);
    expect(result.showFallbackNote).toBe(true);
  });

  it("does not call /responses while serving /api/models", async () => {
    await $fetch("/api/models");

    expect(modelsRequestCount).toBeGreaterThan(0);
    expect(responsesRequestCount).toBe(0);
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

  it("returns stable error contract when upstream network request fails", async () => {
    simulateModelsNetworkError = true;

    try {
      await $fetch("/api/models");
      throw new Error("Expected request to fail");
    } catch (error) {
      const fetchError = error as {
        statusCode?: number;
        status?: number;
        data?: { message?: string; details?: string };
      };

      expect(fetchError.statusCode ?? fetchError.status).toBe(500);
      expect(fetchError.data?.message).toBe(
        "Error: Failed API call, could not get list of OpenAI models",
      );
      expect(fetchError.data?.details).toBeTruthy();
      expect(fetchError.data?.details).toMatch(
        /fetch failed|connection reset|ECONNREFUSED|ECONNRESET/i,
      );
      expect(fetchError.data?.details).not.toContain("test-key");
    }
  });

  it("returns stable error contract when upstream payload is malformed", async () => {
    mockStatus = 500;
    mockRawBody = "{ malformed json";

    try {
      await $fetch("/api/models");
      throw new Error("Expected request to fail");
    } catch (error) {
      const fetchError = error as {
        statusCode?: number;
        status?: number;
        data?: { message?: string; details?: string };
      };

      expect(fetchError.statusCode ?? fetchError.status).toBe(500);
      expect(fetchError.data?.message).toBe(
        "Error: Failed API call, could not get list of OpenAI models",
      );
      expect(fetchError.data?.details).toContain("status: 500");
    }
  });
});
