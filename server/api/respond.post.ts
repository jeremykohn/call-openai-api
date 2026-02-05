import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import type { ApiErrorResponse, ApiSuccessResponse, PromptRequest } from "../../types/chat";
import { validatePrompt } from "../../app/utils/prompt-validation";

const OPENAI_PATH = "responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

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

  if (!apiKey) {
    setResponseStatus(event, 500);
    return { message: "OpenAI API key is not configured." } satisfies ApiErrorResponse;
  }

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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: validation.prompt
      })
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
        response.headers.get("x-request-id") ?? response.headers.get("x-openai-request-id");
      const errorMessage = payload.error?.message;
      const detailParts = [
        errorMessage,
        payload.error?.type ? `type: ${payload.error.type}` : undefined,
        payload.error?.code ? `code: ${payload.error.code}` : undefined,
        payload.error?.param ? `param: ${payload.error.param}` : undefined,
        response.status ? `status: ${response.status}` : undefined,
        response.statusText ? `statusText: ${response.statusText}` : undefined,
        requestId ? `requestId: ${requestId}` : undefined,
        !errorMessage && rawBody ? `response: ${rawBody.slice(0, 300)}` : undefined
      ].filter(Boolean);

      setResponseStatus(event, response.status || 500);
      return {
        message: "Request to OpenAI failed.",
        details: detailParts.length ? detailParts.join(" | ") : undefined
      } satisfies ApiErrorResponse;
    }

    const text = extractOutputText(payload);

    const result: ApiSuccessResponse = {
      response: text
    };

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;

    setResponseStatus(event, 500);
    return {
      message: "Request to OpenAI failed.",
      details: message
    } satisfies ApiErrorResponse;
  }
});
