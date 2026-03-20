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
  readCachedModelsResponse,
  triggerCachedModelsBackgroundRefresh,
  writeCachedModelsResponse,
} from "../utils/models-response-cache";
import {
  buildExcludedModelIdSet,
  filterAndSortModelsForDropdown,
} from "../utils/openai-models-config";
import { loadOpenAIModelsConfig } from "../utils/openai-models-config-loader";
import { HTTP_STATUS } from "../constants/http-status";

const OPENAI_PATH = "models";

// Intentionally returns all upstream OpenAI models without capability filtering.
// Security checks (config validity + allowed host enforcement) are still required.
export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const shouldUseResponseCache = !parseBooleanConfig(
    config.openaiDisableModelsCache,
  );
  const apiKey = config.openaiApiKey?.trim?.();
  const baseUrl = config.openaiBaseUrl;
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

  const buildModelsResponse = async (
    upstreamModels: ModelsResponse["data"],
  ): Promise<ModelsResponse> => {
    const configResult = await loadOpenAIModelsConfig();

    if (configResult.mode === "config-valid") {
      const excludedModelIds = buildExcludedModelIdSet(configResult.config);
      const filteredModels = filterAndSortModelsForDropdown(
        upstreamModels,
        excludedModelIds,
      );

      return {
        object: "list",
        data: filteredModels,
        usedConfigFilter: true,
        showFallbackNote: false,
      } satisfies ModelsResponse;
    }

    return {
      object: "list",
      data: filterAndSortModelsForDropdown(upstreamModels, new Set<string>()),
      usedConfigFilter: false,
      showFallbackNote: true,
    } satisfies ModelsResponse;
  };

  const fetchModels = async (): Promise<ModelsResponse> => {
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

    cacheModelsForBaseUrl(baseUrl, upstreamModels);
    if (shouldUseResponseCache) {
      writeCachedModelsResponse(baseUrl, upstreamModels);
    }

    return buildModelsResponse(upstreamModels);
  };

  if (shouldUseResponseCache) {
    const cached = readCachedModelsResponse(baseUrl);
    if (cached?.fresh) {
      return buildModelsResponse(cached.models);
    }

    if (cached && !cached.fresh) {
      triggerCachedModelsBackgroundRefresh(baseUrl, async () => {
        const refreshed = await fetchModels();
        return [...refreshed.data];
      });

      return buildModelsResponse(cached.models);
    }
  }

  try {
    return await fetchModels();
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
