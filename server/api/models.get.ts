import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import type { ModelsErrorResponse, ModelsResponse, OpenAIModel } from "../../types/models";

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

const buildModelsUrl = (baseUrl: string): string => {
  const url = new URL(baseUrl);
  const normalizedPath = url.pathname.replace(/\/$/, "");
  url.pathname = `${normalizedPath}/${OPENAI_PATH}`;
  return url.toString();
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

const sanitizeDetails = (details: string, apiKey: string | null): string => {
  if (!apiKey) {
    return details;
  }

  const escapedKey = apiKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyPattern = new RegExp(escapedKey, "g");
  return details.replace(keyPattern, "[redacted]").replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]");
};

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey || null;
  const baseUrl = config.openaiBaseUrl;
  const allowedHosts = parseAllowedHosts(config.openaiAllowedHosts);

  if (allowedHosts.length && !isAllowedHost(baseUrl, allowedHosts)) {
    setResponseStatus(event, 500);
    return { message: "OpenAI base URL is not allowed." } satisfies ModelsErrorResponse;
  }

  if (!apiKey) {
    setResponseStatus(event, 500);
    return { message: "OpenAI API key is not configured." } satisfies ModelsErrorResponse;
  }

  try {
    const requestUrl = buildModelsUrl(baseUrl);
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
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
      const requestId =
        response.headers.get("x-request-id") ?? response.headers.get("x-openai-request-id");
      const detailParts = [
        payload.error?.message,
        payload.error?.type ? `type: ${payload.error.type}` : undefined,
        payload.error?.code ? `code: ${payload.error.code}` : undefined,
        payload.error?.param ? `param: ${payload.error.param}` : undefined,
        response.status ? `status: ${response.status}` : undefined,
        response.statusText ? `statusText: ${response.statusText}` : undefined,
        requestId ? `requestId: ${requestId}` : undefined,
        !payload.error?.message && rawBody ? `response: ${rawBody.slice(0, 300)}` : undefined
      ].filter(Boolean);

      const details = detailParts.length
        ? sanitizeDetails(detailParts.join(" | "), apiKey)
        : undefined;

      setResponseStatus(event, response.status || 500);
      return {
        message: "Error: Failed API call, could not get list of OpenAI models",
        details
      } satisfies ModelsErrorResponse;
    }

    const models = (payload.data ?? []).map(({ id, created, owned_by }) => ({
      id,
      object: "model" as const,
      created,
      owned_by
    }));

    return { data: models } satisfies Pick<ModelsResponse, "data">;
  } catch (error) {
    const detailText = error instanceof Error ? error.message : "Unknown error";
    setResponseStatus(event, 500);
    return {
      message: "Error: Failed API call, could not get list of OpenAI models",
      details: sanitizeDetails(detailText, apiKey)
    } satisfies ModelsErrorResponse;
  }
});
