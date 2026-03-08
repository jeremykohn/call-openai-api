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
import { HTTP_STATUS } from "../constants/http-status";

const OPENAI_PATH = "models";

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey?.trim?.();
  const baseUrl = config.openaiBaseUrl;
  const allowedHosts = parseAllowedHosts(config.openaiAllowedHosts);
  const invalidAllowedHosts = parseInvalidAllowedHosts(config.openaiAllowedHosts);
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

  if (
    !isAllowedHost(baseUrl, allowedHosts, { allowInsecureHttp })
  ) {
    setResponseStatus(event, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return {
      message: "OpenAI base URL is not allowed.",
    } satisfies ModelsErrorResponse;
  }

  try {
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

      setResponseStatus(
        event,
        response.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      return {
        message: "Error: Failed API call, could not get list of OpenAI models",
        details,
      } satisfies ModelsErrorResponse;
    }

    const models = (payload.data ?? []).map(({ id, created, owned_by }) => ({
      id,
      object: "model" as const,
      created,
      owned_by,
    }));

    return {
      object: "list",
      data: models,
    } satisfies ModelsResponse;
  } catch (error) {
    const detailText = error instanceof Error ? error.message : "Unknown error";
    setResponseStatus(event, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return {
      message: "Error: Failed API call, could not get list of OpenAI models",
      details: sanitizeDetails(detailText, apiKey),
    } satisfies ModelsErrorResponse;
  }
});
