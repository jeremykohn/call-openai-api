import type { OpenAIModel } from "../../types/models";

export type OpenAIModelsConfig = {
  "available-models": string[];
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
  "available-models",
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
      "available-models": [...(configObject["available-models"] as string[])],
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

const normalizeStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  if (value.some((entry) => typeof entry !== "string")) {
    return null;
  }

  return [...new Set(value as string[])].sort((left, right) =>
    left.localeCompare(right),
  );
};

export const normalizeOpenAIModelsConfig = (
  rawConfig: unknown,
): OpenAIModelsConfig | null => {
  if (
    typeof rawConfig !== "object" ||
    rawConfig === null ||
    Array.isArray(rawConfig)
  ) {
    return null;
  }

  const configObject = rawConfig as Record<string, unknown>;

  const availableModels = normalizeStringArray(
    configObject["available-models"] ?? [],
  );
  const modelsWithError = normalizeStringArray(
    configObject["models-with-error"],
  );
  const modelsWithNoResponse = normalizeStringArray(
    configObject["models-with-no-response"],
  );
  const otherModels = normalizeStringArray(configObject["other-models"]);

  if (
    availableModels === null ||
    modelsWithError === null ||
    modelsWithNoResponse === null ||
    otherModels === null
  ) {
    return null;
  }

  const normalized: OpenAIModelsConfig = {
    "available-models": availableModels,
    "models-with-error": modelsWithError,
    "models-with-no-response": modelsWithNoResponse,
    "other-models": otherModels,
  };

  return normalized;
};

export const serializeOpenAIModelsConfig = (
  config: OpenAIModelsConfig,
): string => {
  const normalized = normalizeOpenAIModelsConfig(config);

  if (!normalized) {
    throw new Error("Cannot serialize invalid OpenAI models config");
  }

  const orderedConfig = {
    "available-models": normalized["available-models"],
    "models-with-error": normalized["models-with-error"],
    "models-with-no-response": normalized["models-with-no-response"],
    "other-models": normalized["other-models"],
  };

  return `${JSON.stringify(orderedConfig, null, 2)}\n`;
};
