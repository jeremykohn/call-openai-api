import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import type { ModelsErrorResponse, ModelsResponse } from "../../types/models";
import type { OpenAIModelsPayload } from "../types/openai";
import {
  buildOpenAIErrorDetails,
  buildOpenAIUrl,
  isAllowedHost,
  parseBooleanConfig,
  parseAllowedHosts,
  parseInvalidAllowedHosts,
  sanitizeDetails,
  validateOpenAIConfig,
} from "../utils/openai-security";
import { cacheModelsForBaseUrl } from "../utils/openai-model-validation";
import {
  discoverModelCandidates,
  probeModelCapabilities,
} from "../utils/model-capability-discovery";
import {
  readCachedModelsResponse,
  triggerCachedModelsBackgroundRefresh,
  writeCachedModelsResponse,
} from "../utils/model-capability-models-cache";
import { resolveModelCapability } from "../utils/model-capability";
import { loadAllowedModelsOverrides } from "../utils/model-capability-overrides";
import {
  emitCapabilityMetrics,
  logCapabilityInfo,
  summarizeCapabilityStatuses,
} from "../utils/model-capability-observability";
import { HTTP_STATUS } from "../constants/http-status";

const OPENAI_PATH = "models";

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const shouldUseResponseCache = !parseBooleanConfig(
    config.openaiDisableModelsCache,
  );
  const apiKey = config.openaiApiKey?.trim?.();
  const baseUrl = config.openaiBaseUrl;
  const overridesPath = config.openaiAllowedModelsOverridesPath;
  const allowedHosts = parseAllowedHosts(config.openaiAllowedHosts);
  const invalidAllowedHosts = parseInvalidAllowedHosts(
    config.openaiAllowedHosts,
  );
  const allowInsecureHttp = parseBooleanConfig(config.openaiAllowInsecureHttp);

  const validation = validateOpenAIConfig({
    apiKey,
    allowedHosts,
    invalidAllowedHosts,
  });

  if (!validation.valid) {
    setResponseStatus(event, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return {
      message: validation.reason,
    } satisfies ModelsErrorResponse;
  }

  if (!isAllowedHost(baseUrl, allowedHosts, { allowInsecureHttp })) {
    setResponseStatus(event, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return {
      message: "OpenAI base URL is not allowed.",
    } satisfies ModelsErrorResponse;
  }

  const fetchAndFilterModels = async (): Promise<ModelsResponse> => {
    logCapabilityInfo("models.discovery.start", { baseUrl });
    const requestUrl = buildOpenAIUrl(baseUrl, OPENAI_PATH);
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const rawBody = await response.text();
    let payload: OpenAIModelsPayload = {};

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as OpenAIModelsPayload;
      } catch {
        payload = {};
      }
    }

    if (!response.ok) {
      const details = buildOpenAIErrorDetails({
        payload,
        response,
        rawBody,
        apiKey,
      });

      const error = new Error(
        "Error: Failed API call, could not get list of OpenAI models",
      ) as Error & {
        statusCode?: number;
        details?: string;
      };
      error.statusCode = response.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      error.details = details;
      throw error;
    }

    const upstreamModels = (payload.data ?? []).map(
      ({ id, created, owned_by }) => ({
        id,
        object: "model" as const,
        created,
        owned_by,
      }),
    );

    const overrides = loadAllowedModelsOverrides(overridesPath);
    const candidates = discoverModelCandidates(payload);
    const probeResults = await probeModelCapabilities({
      modelIds: candidates,
      apiKey,
      baseUrl,
    });

    const now = Date.now();
    const resolvedRecords: Record<
      string,
      ReturnType<typeof resolveModelCapability>
    > = {};
    const models = upstreamModels.flatMap((model) => {
      const resolved = resolveModelCapability({
        modelId: model.id,
        overrides,
        probeRecord: probeResults[model.id],
        now,
      });
      resolvedRecords[model.id] = resolved;

      if (resolved.status === "unsupported") {
        return [];
      }

      if (resolved.status === "unknown") {
        return [{ ...model, capabilityUnverified: true }];
      }

      return [model];
    });

    const summary = summarizeCapabilityStatuses(resolvedRecords);
    const cacheHits = Object.values(resolvedRecords).filter(
      (record) => record.source === "cache",
    ).length;
    const cacheHitRate =
      candidates.length === 0 ? 0 : cacheHits / candidates.length;

    logCapabilityInfo("models.discovery.complete", {
      baseUrl,
      discovered: candidates.length,
      emitted: models.length,
      supported: summary.supported,
      unsupported: summary.unsupported,
      unknown: summary.unknown,
    });

    emitCapabilityMetrics({
      discovered: candidates.length,
      probed: candidates.length,
      supported: summary.supported,
      unsupported: summary.unsupported,
      unknown: summary.unknown,
      cacheHitRate,
    });

    cacheModelsForBaseUrl(baseUrl, models);
    if (shouldUseResponseCache) {
      writeCachedModelsResponse(baseUrl, models);
    }

    return {
      object: "list",
      data: models,
    } satisfies ModelsResponse;
  };

  if (shouldUseResponseCache) {
    const cached = readCachedModelsResponse(baseUrl);
    if (cached?.fresh) {
      logCapabilityInfo("models.cache.hit", {
        baseUrl,
        fresh: true,
        modelCount: cached.models.length,
      });

      return {
        object: "list",
        data: cached.models,
      } satisfies ModelsResponse;
    }

    if (cached && !cached.fresh) {
      logCapabilityInfo("models.cache.hit", {
        baseUrl,
        fresh: false,
        modelCount: cached.models.length,
      });

      triggerCachedModelsBackgroundRefresh(baseUrl, async () => {
        logCapabilityInfo("models.cache.background_refresh.start", { baseUrl });
        const refreshed = await fetchAndFilterModels();
        logCapabilityInfo("models.cache.background_refresh.complete", {
          baseUrl,
          modelCount: refreshed.data.length,
        });
        return [...refreshed.data];
      });

      return {
        object: "list",
        data: cached.models,
      } satisfies ModelsResponse;
    }

    logCapabilityInfo("models.cache.miss", { baseUrl });
  }

  try {
    return await fetchAndFilterModels();
  } catch (error) {
    const routeError = error as {
      statusCode?: number;
      details?: string;
      message?: string;
    };

    if (routeError.statusCode) {
      setResponseStatus(event, routeError.statusCode);
      return {
        message: "Error: Failed API call, could not get list of OpenAI models",
        details: routeError.details,
      } satisfies ModelsErrorResponse;
    }

    const detailText = error instanceof Error ? error.message : "Unknown error";
    setResponseStatus(event, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return {
      message: "Error: Failed API call, could not get list of OpenAI models",
      details: sanitizeDetails(detailText, apiKey),
    } satisfies ModelsErrorResponse;
  }
});
