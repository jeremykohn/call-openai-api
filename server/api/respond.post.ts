import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  PromptRequest,
} from "../../types/chat";
import type { OpenAIModel } from "../../types/models";
import { validatePrompt } from "../../app/utils/prompt-validation";
import { DEFAULT_MODEL } from "../../shared/constants/models";
import {
  buildOpenAIUrl,
  isAllowedHost,
  parseAllowedHosts,
  sanitizeDetails,
} from "../utils/openai-security";

const OPENAI_PATH = "responses";
const MODELS_PATH = "models";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ text?: string }>;
  }>;
};

type OpenAIErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
    param?: string;
  };
};

/**
 * Fetches available models from OpenAI API.
 * Returns array of model IDs on success, or null if fetch fails or response is invalid.
 * Failure to fetch models triggers a fail-closed validation (502 response).
 */
const fetchAvailableModels = async (
  apiKey: string,
  baseUrl: string,
): Promise<string[] | null> => {
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
    return (payload.data ?? []).map((model) => model.id);
  } catch {
    return null;
  }
};

/**
 * Resolves the model to use for OpenAI request
 * Validates against available models if model is provided
 * Returns resolved model ID or error details
 */
const resolveModel = async (
  requestedModel: string | undefined,
  apiKey: string,
  baseUrl: string,
): Promise<{ model: string } | { error: string; statusCode: 400 | 502 }> => {
  // If no model requested, use default
  if (!requestedModel || requestedModel.trim() === "") {
    return { model: DEFAULT_MODEL };
  }

  // Fetch available models to validate
  const availableModels = await fetchAvailableModels(apiKey, baseUrl);

  // Return 502 (Bad Gateway) when model validation cannot be performed due to
  // upstream OpenAI API unavailability—signals a dependency issue, not our fault
  if (availableModels === null) {
    return {
      error: "Unable to validate model right now. Please try again.",
      statusCode: 502,
    };
  }

  // Validate requested model exists in available models
  if (!availableModels.includes(requestedModel)) {
    return { error: "Model is not valid", statusCode: 400 };
  }

  return { model: requestedModel };
};

const extractOutputText = (response: OpenAIResponse): string => {
  if (response.output_text) {
    return response.output_text;
  }

  const first = response.output?.[0]?.content?.[0]?.text;
  return first ?? "";
};

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<PromptRequest>(event);
  const validation = validatePrompt(body?.prompt ?? "");

  if (!validation.ok) {
    setResponseStatus(event, 400);
    return { message: validation.error } satisfies ApiErrorResponse;
  }

  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey;
  const baseUrl = config.openaiBaseUrl;
  const allowedHosts = parseAllowedHosts(config.openaiAllowedHosts);

  if (allowedHosts.length && !isAllowedHost(baseUrl, allowedHosts)) {
    setResponseStatus(event, 500);
    return {
      message: "OpenAI base URL is not allowed.",
    } satisfies ApiErrorResponse;
  }

  if (!apiKey) {
    setResponseStatus(event, 500);
    return {
      message: "OpenAI API key is not configured.",
    } satisfies ApiErrorResponse;
  }

  // Resolve model: validate if provided, use default if not
  const modelResolution = await resolveModel(body.model, apiKey, baseUrl);
  if ("error" in modelResolution) {
    setResponseStatus(event, modelResolution.statusCode);
    return { message: modelResolution.error } satisfies ApiErrorResponse;
  }

  const resolvedModel = modelResolution.model;

  try {
    const requestUrl = buildOpenAIUrl(baseUrl, OPENAI_PATH);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        input: validation.prompt,
      }),
    });

    const rawBody = await response.text();
    let payload: OpenAIResponse & OpenAIErrorPayload = {};

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as OpenAIResponse & OpenAIErrorPayload;
      } catch {
        payload = {};
      }
    }

    if (!response.ok) {
      const requestId =
        response.headers.get("x-request-id") ??
        response.headers.get("x-openai-request-id");
      const errorMessage = payload.error?.message;
      const detailParts = [
        errorMessage,
        payload.error?.type ? `type: ${payload.error.type}` : undefined,
        payload.error?.code ? `code: ${payload.error.code}` : undefined,
        payload.error?.param ? `param: ${payload.error.param}` : undefined,
        response.status ? `status: ${response.status}` : undefined,
        response.statusText ? `statusText: ${response.statusText}` : undefined,
        requestId ? `requestId: ${requestId}` : undefined,
        !errorMessage && rawBody
          ? `response: ${rawBody.slice(0, 300)}`
          : undefined,
      ].filter(Boolean);

      const details = detailParts.length
        ? sanitizeDetails(detailParts.join(" | "), apiKey)
        : undefined;

      setResponseStatus(event, response.status || 500);
      return {
        message: "Request to OpenAI failed.",
        details,
      } satisfies ApiErrorResponse;
    }

    const text = extractOutputText(payload);

    const result: ApiSuccessResponse = {
      response: text,
      model: resolvedModel,
    };

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    const details = message ? sanitizeDetails(message, apiKey) : undefined;

    setResponseStatus(event, 500);
    return {
      message: "Request to OpenAI failed.",
      details,
    } satisfies ApiErrorResponse;
  }
});
