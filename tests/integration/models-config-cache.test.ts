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

const env = captureEnvVars([...ENV_KEYS]);

let mockStatus = 200;
let mockBody: unknown = {
  object: "list",
  data: [
    {
      id: "alpha-model",
      object: "model",
      created: 1686935002,
      owned_by: "openai",
    },
    {
      id: "beta-model",
      object: "model",
      created: 1686935003,
      owned_by: "openai",
    },
  ],
};
let modelsRequestCount = 0;

const resetMockServerState = (): void => {
  mockStatus = 200;
  mockBody = {
    object: "list",
    data: [
      {
        id: "alpha-model",
        object: "model",
        created: 1686935002,
        owned_by: "openai",
      },
      {
        id: "beta-model",
        object: "model",
        created: 1686935003,
        owned_by: "openai",
      },
    ],
  };
  modelsRequestCount = 0;
};

const mockServer = createServer((request, response) => {
  if (request.url === "/models") {
    modelsRequestCount += 1;

    response.statusCode = mockStatus;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(mockBody));
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
process.env.OPENAI_DISABLE_MODELS_CACHE = "false";

await setup({ rootDir, dev: true });

beforeEach(async () => {
  resetMockServerState();
  await rm(configFilePath, { force: true });
});

afterAll(async () => {
  await writeFile(configFilePath, `${defaultConfigFileContent}\n`, "utf-8");
  mockServer.close();
  env.restoreAll();
});

describe("GET /api/models cache behavior with config filtering", () => {
  it("uses cached upstream models while reflecting updated local config filtering", async () => {
    await writeFile(
      configFilePath,
      JSON.stringify(
        {
          "available-models": [],
          "models-with-error": ["alpha-model"],
          "models-with-no-response": [],
          "other-models": [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    const firstResult = await $fetch<{
      object: "list";
      data: Array<{ id: string }>;
      usedConfigFilter: boolean;
      showFallbackNote: boolean;
    }>("/api/models");

    await writeFile(
      configFilePath,
      JSON.stringify(
        {
          "available-models": [],
          "models-with-error": ["beta-model"],
          "models-with-no-response": [],
          "other-models": [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    const secondResult = await $fetch<{
      object: "list";
      data: Array<{ id: string }>;
      usedConfigFilter: boolean;
      showFallbackNote: boolean;
    }>("/api/models");

    expect(firstResult.data.map((model) => model.id)).toEqual(["beta-model"]);
    expect(secondResult.data.map((model) => model.id)).toEqual(["alpha-model"]);
    expect(firstResult.usedConfigFilter).toBe(true);
    expect(secondResult.usedConfigFilter).toBe(true);
    expect(firstResult.showFallbackNote).toBe(false);
    expect(secondResult.showFallbackNote).toBe(false);
    expect(modelsRequestCount).toBe(1);
  });
});
