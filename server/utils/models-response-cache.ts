import type { OpenAIModel } from "../../types/models";

export const MODELS_RESPONSE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedModelsResponse = {
  cacheKey: string;
  models: OpenAIModel[];
  timestamp: number;
};

let cachedModelsResponse: CachedModelsResponse | null = null;
const refreshInFlight = new Set<string>();

const buildCacheKey = (baseUrl: string): string => baseUrl;

export const readCachedModelsResponse = (
  baseUrl: string,
  now = Date.now(),
): { models: OpenAIModel[]; fresh: boolean } | null => {
  const cacheKey = buildCacheKey(baseUrl);
  if (!cachedModelsResponse || cachedModelsResponse.cacheKey !== cacheKey) {
    return null;
  }

  const fresh =
    now - cachedModelsResponse.timestamp < MODELS_RESPONSE_CACHE_TTL_MS;
  return {
    models: cachedModelsResponse.models,
    fresh,
  };
};

export const writeCachedModelsResponse = (
  baseUrl: string,
  models: OpenAIModel[],
  now = Date.now(),
): void => {
  cachedModelsResponse = {
    cacheKey: buildCacheKey(baseUrl),
    models,
    timestamp: now,
  };
};

export const clearCachedModelsResponse = (): void => {
  cachedModelsResponse = null;
  refreshInFlight.clear();
};

export const triggerCachedModelsBackgroundRefresh = (
  baseUrl: string,
  refresh: () => Promise<OpenAIModel[]>,
): void => {
  const cacheKey = buildCacheKey(baseUrl);
  if (refreshInFlight.has(cacheKey)) {
    return;
  }

  refreshInFlight.add(cacheKey);

  void refresh()
    .then((models) => {
      writeCachedModelsResponse(baseUrl, models);
    })
    .finally(() => {
      refreshInFlight.delete(cacheKey);
    });
};

export const isModelsRefreshInFlight = (baseUrl: string): boolean => {
  return refreshInFlight.has(buildCacheKey(baseUrl));
};
