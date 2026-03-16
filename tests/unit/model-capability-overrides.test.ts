import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  loadAllowedModelsOverrides,
  parseAllowedModelsOverrides,
} from "../../server/utils/model-capability-overrides";

describe("model capability overrides", () => {
  it("parses valid overrides config payload", () => {
    const parsed = parseAllowedModelsOverrides({
      allowed_models: [" gpt-4.1-mini ", "gpt-4.1-mini", "o3-mini"],
      disallowed_models: ["dall-e-3", "  ", "dall-e-3"],
    });

    expect(parsed).toEqual({
      allowed_models: ["gpt-4.1-mini", "o3-mini"],
      disallowed_models: ["dall-e-3"],
    });
  });

  it("throws for malformed payloads", () => {
    expect(() => parseAllowedModelsOverrides(null)).toThrow(
      "Overrides config must be an object",
    );

    expect(() =>
      parseAllowedModelsOverrides({
        allowed_models: "gpt-4.1-mini",
        disallowed_models: [],
      }),
    ).toThrow("Override list must be an array");

    expect(() =>
      parseAllowedModelsOverrides({
        allowed_models: [],
        disallowed_models: "dall-e-3",
      }),
    ).toThrow("Override list must be an array");
  });

  it("loads overrides from a config file", () => {
    const dir = mkdtempSync(join(tmpdir(), "model-overrides-"));
    const filePath = join(dir, "allowed-models-overrides.json");

    writeFileSync(
      filePath,
      JSON.stringify({
        allowed_models: ["gpt-4.1-mini"],
        disallowed_models: ["text-embedding-ada-002"],
      }),
      "utf8",
    );

    try {
      const loaded = loadAllowedModelsOverrides(filePath);
      expect(loaded).toEqual({
        allowed_models: ["gpt-4.1-mini"],
        disallowed_models: ["text-embedding-ada-002"],
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws for malformed JSON files", () => {
    const dir = mkdtempSync(join(tmpdir(), "model-overrides-bad-"));
    const filePath = join(dir, "allowed-models-overrides.json");
    writeFileSync(filePath, "{ invalid json", "utf8");

    try {
      expect(() => loadAllowedModelsOverrides(filePath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
