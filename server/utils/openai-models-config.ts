import type { OpenAIModel } from "../../types/models";

export type OpenAIModelsConfig = {
  "models-with-error": string[];
  "models-with-no-response": string[];
  "other-models": string[];
};

export type OpenAIModelsConfigValidationResult =
  | {
      ok: true;
      config: OpenAIModelsConfig;
    }
  | {
      ok: false;
      reason:
        | "config-not-object"
        | "missing-required-key"
        | "invalid-key-type"
        | "invalid-entry-type";
    };

const REQUIRED_KEYS = [
  "models-with-error",
  "models-with-no-response",
  "other-models",
] as const;

export const parseOpenAIModelsConfig = (
  rawConfig: unknown,
): OpenAIModelsConfigValidationResult => {
  if (
    typeof rawConfig !== "object" ||
    rawConfig === null ||
    Array.isArray(rawConfig)
  ) {
    return {
      ok: false,
      reason: "config-not-object",
    };
  }

  const configObject = rawConfig as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    if (!(key in configObject)) {
      return {
        ok: false,
        reason: "missing-required-key",
      };
    }

    if (!Array.isArray(configObject[key])) {
      return {
        ok: false,
        reason: "invalid-key-type",
      };
    }

    if (
      (configObject[key] as unknown[]).some(
        (entry) => typeof entry !== "string",
      )
    ) {
      return {
        ok: false,
        reason: "invalid-entry-type",
      };
    }
  }

  return {
    ok: true,
    config: {
      "models-with-error": [...(configObject["models-with-error"] as string[])],
      "models-with-no-response": [
        ...(configObject["models-with-no-response"] as string[]),
      ],
      "other-models": [...(configObject["other-models"] as string[])],
    },
  };
};

export const buildExcludedModelIdSet = (
  config: OpenAIModelsConfig,
): ReadonlySet<string> => {
  return new Set<string>([
    ...config["models-with-error"],
    ...config["models-with-no-response"],
  ]);
};

export const filterAndSortModelsForDropdown = (
  upstreamModels: readonly OpenAIModel[],
  excludedModelIds: ReadonlySet<string>,
): OpenAIModel[] => {
  return upstreamModels
    .filter((model) => !excludedModelIds.has(model.id))
    .sort((left, right) => left.id.localeCompare(right.id));
};
