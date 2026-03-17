import type { OpenAIModel } from "~~/types/models";
import { DEFAULT_MODEL } from "~~/shared/constants/models";
import { HTTP_STATUS } from "../constants/http-status";
import { buildOpenAIUrl } from "./openai-security";

const MODELS_PATH = "models";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DISABLE_MODEL_VALIDATION_CACHE =
  process.env.OPENAI_DISABLE_MODEL_VALIDATION_CACHE === "true";

type ModelResolutionError = {
  error: string;
  statusCode: 400 | 502;
};

export type ModelResolutionResult = { model: string } | ModelResolutionError;

type ModelsCache = {
  cacheKey: string;
  models: Array<{ id: string }>;
  timestamp: number;
};

// Single-entry cache: only one base URL is cached at a time. Switching
// OPENAI_BASE_URL at runtime evicts the previous entry. Intentional for
// single-config deployments.
let modelsCache: ModelsCache | null = null;

const buildCacheKey = (baseUrl: string): string => {
  return baseUrl;
};

const getCachedModels = (baseUrl: string): Array<{ id: string }> | null => {
  if (DISABLE_MODEL_VALIDATION_CACHE) {
    return null;
  }

  const cacheKey = buildCacheKey(baseUrl);

  if (!modelsCache || modelsCache.cacheKey !== cacheKey) {
    return null;
  }

  if (Date.now() - modelsCache.timestamp >= CACHE_TTL_MS) {
    return null;
  }

  return modelsCache.models;
};

const fetchAvailableModels = async (
  apiKey: string,
  baseUrl: string,
): Promise<Array<{ id: string }> | null> => {
  const cachedModels = getCachedModels(baseUrl);
  if (cachedModels) {
    return cachedModels;
  }

  try {
    const response = await fetch(buildOpenAIUrl(baseUrl, MODELS_PATH), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: OpenAIModel[] };
    const models = (payload.data ?? []).map((model) => ({
      id: model.id,
    }));

    if (!DISABLE_MODEL_VALIDATION_CACHE) {
      modelsCache = {
        cacheKey: buildCacheKey(baseUrl),
        models,
        timestamp: Date.now(),
      };
    }

    return models;
  } catch {
    return null;
  }
};

export const resolveModel = async (
  requestedModel: string | undefined,
  apiKey: string,
  baseUrl: string,
): Promise<ModelResolutionResult> => {
  if (!requestedModel || requestedModel.trim() === "") {
    return { model: DEFAULT_MODEL };
  }

  const availableModels = await fetchAvailableModels(apiKey, baseUrl);

  if (!availableModels) {
    return {
      error: "Unable to validate model right now. Please try again.",
      statusCode: HTTP_STATUS.BAD_GATEWAY,
    };
  }

  const matchedModel = availableModels.find(
    (model) => model.id === requestedModel,
  );

  if (!matchedModel) {
    return {
      error: "Model is not valid",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    };
  }

  return { model: requestedModel };
};

/**
 * Clears the models cache. Useful for testing.
 */
export const clearModelsCache = (): void => {
  modelsCache = null;
};

export const cacheModelsForBaseUrl = (
  baseUrl: string,
  models: readonly Pick<OpenAIModel, "id">[],
): void => {
  if (DISABLE_MODEL_VALIDATION_CACHE) {
    return;
  }

  modelsCache = {
    cacheKey: buildCacheKey(baseUrl),
    models: models.map((model) => ({
      id: model.id,
    })),
    timestamp: Date.now(),
  };
};
