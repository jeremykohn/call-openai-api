import { describe, expect, it } from "vitest";
import type { OpenAIModel } from "~~/types/models";
import {
  buildExcludedModelIdSet,
  filterAndSortModelsForDropdown,
  parseOpenAIModelsConfig,
} from "~~/server/utils/openai-models-config";

describe("parseOpenAIModelsConfig", () => {
  it("accepts a valid config object with required keys", () => {
    const result = parseOpenAIModelsConfig({
      "models-with-error": ["gpt-legacy"],
      "models-with-no-response": ["gpt-timeout"],
      "other-models": ["gpt-informational"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config["models-with-error"]).toEqual(["gpt-legacy"]);
      expect(result.config["models-with-no-response"]).toEqual(["gpt-timeout"]);
      expect(result.config["other-models"]).toEqual(["gpt-informational"]);
    }
  });

  it("rejects non-object root values", () => {
    expect(parseOpenAIModelsConfig(null)).toEqual({
      ok: false,
      reason: "config-not-object",
    });

    expect(parseOpenAIModelsConfig([])).toEqual({
      ok: false,
      reason: "config-not-object",
    });

    expect(parseOpenAIModelsConfig("invalid")).toEqual({
      ok: false,
      reason: "config-not-object",
    });
  });

  it("rejects configs missing required keys", () => {
    const result = parseOpenAIModelsConfig({
      "models-with-error": ["gpt-legacy"],
      "models-with-no-response": ["gpt-timeout"],
    });

    expect(result).toEqual({
      ok: false,
      reason: "missing-required-key",
    });
  });

  it("rejects configs with non-array key values", () => {
    const result = parseOpenAIModelsConfig({
      "models-with-error": ["gpt-legacy"],
      "models-with-no-response": "gpt-timeout",
      "other-models": ["gpt-informational"],
    });

    expect(result).toEqual({
      ok: false,
      reason: "invalid-key-type",
    });
  });

  it("rejects configs containing non-string entries", () => {
    const result = parseOpenAIModelsConfig({
      "models-with-error": ["gpt-legacy"],
      "models-with-no-response": [123],
      "other-models": ["gpt-informational"],
    });

    expect(result).toEqual({
      ok: false,
      reason: "invalid-entry-type",
    });
  });
});

describe("filterAndSortModelsForDropdown", () => {
  const upstreamModels: OpenAIModel[] = [
    {
      id: "zeta-model",
      object: "model",
      created: 1686935002,
      owned_by: "openai",
    },
    {
      id: "alpha-model",
      object: "model",
      created: 1686935003,
      owned_by: "openai",
    },
    {
      id: "beta-model",
      object: "model",
      created: 1686935004,
      owned_by: "openai",
    },
  ];

  it("excludes models in models-with-error and models-with-no-response", () => {
    const excludedModelIds = buildExcludedModelIdSet({
      "models-with-error": ["zeta-model"],
      "models-with-no-response": ["beta-model"],
      "other-models": [],
    });

    const filtered = filterAndSortModelsForDropdown(
      upstreamModels,
      excludedModelIds,
    );

    expect(filtered.map((model) => model.id)).toEqual(["alpha-model"]);
  });

  it("ignores other-models for exclusion", () => {
    const excludedModelIds = buildExcludedModelIdSet({
      "models-with-error": [],
      "models-with-no-response": [],
      "other-models": ["beta-model"],
    });

    const filtered = filterAndSortModelsForDropdown(
      upstreamModels,
      excludedModelIds,
    );

    expect(filtered.map((model) => model.id)).toEqual([
      "alpha-model",
      "beta-model",
      "zeta-model",
    ]);
  });

  it("sorts the final model list alphabetically by id", () => {
    const filtered = filterAndSortModelsForDropdown(
      upstreamModels,
      new Set<string>(),
    );

    expect(filtered.map((model) => model.id)).toEqual([
      "alpha-model",
      "beta-model",
      "zeta-model",
    ]);
  });
});
