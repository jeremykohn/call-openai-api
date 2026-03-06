import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import type {
  ModelsErrorResponse,
  ModelsResponse,
  OpenAIModel,
} from "../../types/models";
import {
  buildOpenAIErrorDetails,
  buildOpenAIUrl,
  isAllowedHost,
  parseAllowedHosts,
  sanitizeDetails,
} from "../utils/openai-security";

const OPENAI_PATH = "models";

type OpenAIModelsPayload = {
  object?: string;
  data?: OpenAIModel[];
  error?: {
    message?: string;
    type?: string;
    code?: string;
    param?: string;
  };
};

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey || null;
  const baseUrl = config.openaiBaseUrl;
  const allowedHosts = parseAllowedHosts(config.openaiAllowedHosts);

  if (allowedHosts.length && !isAllowedHost(baseUrl, allowedHosts)) {
    setResponseStatus(event, 500);
    return {
      message: "OpenAI base URL is not allowed.",
    } satisfies ModelsErrorResponse;
  }

  if (!apiKey) {
    setResponseStatus(event, 500);
    return {
      message: "OpenAI API key is not configured.",
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

      setResponseStatus(event, response.status || 500);
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

    return { data: models } satisfies Pick<ModelsResponse, "data">;
  } catch (error) {
    const detailText = error instanceof Error ? error.message : "Unknown error";
    setResponseStatus(event, 500);
    return {
      message: "Error: Failed API call, could not get list of OpenAI models",
      details: sanitizeDetails(detailText, apiKey),
    } satisfies ModelsErrorResponse;
  }
});
