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

const parseAllowedHosts = (allowedHosts: string | undefined): string[] => {
  return (allowedHosts ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
};

const isAllowedHost = (baseUrl: string, allowedHosts: string[]): boolean => {
  try {
    const url = new URL(baseUrl);
    return allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
};

const sanitizeDetails = (
  details: string,
  apiKey: string | undefined,
): string => {
  if (!apiKey) {
    return details.replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]");
  }

  const escapedKey = apiKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyPattern = new RegExp(escapedKey, "g");
  return details
    .replace(keyPattern, "[redacted]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]");
};

/**
 * Fetches available models from OpenAI API
 * Returns array of model IDs or empty array if fetch fails
 */
const fetchAvailableModels = async (
  apiKey: string,
  baseUrl: string,
): Promise<string[]> => {
  try {
    const url = new URL(baseUrl);
    const normalizedPath = url.pathname.replace(/\/$/, "");
    url.pathname = `${normalizedPath}/${MODELS_PATH}`;

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { data?: OpenAIModel[] };
    return (payload.data ?? []).map((model) => model.id);
  } catch {
    return [];
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
): Promise<{ model: string } | { error: string }> => {
  // If no model requested, use default
  if (!requestedModel || requestedModel.trim() === "") {
    return { model: DEFAULT_MODEL };
  }

  // Fetch available models to validate
  const availableModels = await fetchAvailableModels(apiKey, baseUrl);

  // If we couldn't fetch models, allow request to proceed (fail gracefully)
  if (availableModels.length === 0) {
    return { model: requestedModel };
  }

  // Validate requested model exists in available models
  if (!availableModels.includes(requestedModel)) {
    return { error: "Model is not valid" };
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
    setResponseStatus(event, 400);
    return { message: modelResolution.error } satisfies ApiErrorResponse;
  }

  const resolvedModel = modelResolution.model;

  try {
    const requestUrl = (() => {
      const url = new URL(baseUrl);
      const normalizedPath = url.pathname.replace(/\/$/, "");
      url.pathname = `${normalizedPath}/${OPENAI_PATH}`;
      return url.toString();
    })();

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
