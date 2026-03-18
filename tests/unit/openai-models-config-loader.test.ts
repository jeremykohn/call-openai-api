import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadOpenAIModelsConfig } from "~~/server/utils/openai-models-config-loader";

const tempDirs: string[] = [];

const createTempDir = async (): Promise<string> => {
  const directory = await mkdtemp(
    join(tmpdir(), "openai-models-config-loader-"),
  );
  tempDirs.push(directory);
  return directory;
};

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("loadOpenAIModelsConfig", () => {
  it("returns validated config when file exists and matches schema", async () => {
    const dir = await createTempDir();
    const configPath = join(dir, "openai-models.json");

    await writeFile(
      configPath,
      JSON.stringify(
        {
          "models-with-error": ["babbage-002"],
          "models-with-no-response": ["gpt-3.5-turbo-instruct"],
          "other-models": ["gpt-4.1"],
        },
        null,
        2,
      ),
      "utf-8",
    );

    const result = await loadOpenAIModelsConfig(configPath);

    expect(result).toEqual({
      mode: "config-valid",
      config: {
        "models-with-error": ["babbage-002"],
        "models-with-no-response": ["gpt-3.5-turbo-instruct"],
        "other-models": ["gpt-4.1"],
      },
    });
  });

  it("returns fallback mode when config file is missing", async () => {
    const dir = await createTempDir();
    const missingPath = join(dir, "missing-openai-models.json");

    const result = await loadOpenAIModelsConfig(missingPath);

    expect(result).toEqual({
      mode: "fallback",
      reason: "missing-file",
    });
  });

  it("returns fallback mode when config file is unreadable", async () => {
    const dir = await createTempDir();
    const unreadablePath = join(dir, "config-directory");
    await mkdir(unreadablePath);

    const result = await loadOpenAIModelsConfig(unreadablePath);

    expect(result).toEqual({
      mode: "fallback",
      reason: "unreadable-file",
    });
  });

  it("returns fallback mode when config JSON is malformed", async () => {
    const dir = await createTempDir();
    const malformedPath = join(dir, "openai-models.json");

    await writeFile(malformedPath, "{ invalid json", "utf-8");

    const result = await loadOpenAIModelsConfig(malformedPath);

    expect(result).toEqual({
      mode: "fallback",
      reason: "invalid-json",
    });
  });

  it("returns fallback mode when config format is invalid", async () => {
    const dir = await createTempDir();
    const invalidFormatPath = join(dir, "openai-models.json");

    await writeFile(
      invalidFormatPath,
      JSON.stringify({
        "models-with-error": ["babbage-002"],
        "models-with-no-response": "gpt-3.5-turbo-instruct",
        "other-models": ["gpt-4.1"],
      }),
      "utf-8",
    );

    const result = await loadOpenAIModelsConfig(invalidFormatPath);

    expect(result).toEqual({
      mode: "fallback",
      reason: "invalid-format",
      details: "invalid-key-type",
    });
  });
});
