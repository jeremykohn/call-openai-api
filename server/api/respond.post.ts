import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  PromptRequest,
} from "../../types/chat";
import { validatePrompt } from "../../app/utils/prompt-validation";
import {
  buildOpenAIErrorDetails,
  buildOpenAIUrl,
  isAllowedHost,
  parseAllowedHosts,
  sanitizeDetails,
} from "../utils/openai-security";
import {
  extractOutputText,
  parseOpenAIResponseBody,
} from "../utils/openai-response-parser";
import { resolveModel } from "../utils/openai-model-validation";
import { HTTP_STATUS } from "../constants/http-status";

const OPENAI_PATH = "responses";

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<PromptRequest>(event);
  const validation = validatePrompt(body?.prompt ?? "");

  if (!validation.ok) {
    setResponseStatus(event, HTTP_STATUS.BAD_REQUEST);
    return { message: validation.error } satisfies ApiErrorResponse;
  }

  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey;
  const baseUrl = config.openaiBaseUrl;
  const allowedHosts = parseAllowedHosts(config.openaiAllowedHosts);

  if (allowedHosts.length && !isAllowedHost(baseUrl, allowedHosts)) {
    setResponseStatus(event, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return {
      message: "OpenAI base URL is not allowed.",
    } satisfies ApiErrorResponse;
  }

  if (!apiKey) {
    setResponseStatus(event, HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
    const payload = parseOpenAIResponseBody(rawBody);

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

    setResponseStatus(event, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return {
      message: "Request to OpenAI failed.",
      details,
    } satisfies ApiErrorResponse;
  }
});
