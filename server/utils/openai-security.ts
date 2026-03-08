import type { OpenAIErrorPayload } from "../types/openai";

export const parseAllowedHosts = (
  allowedHosts: string | undefined,
): string[] => {
  return (allowedHosts ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
};

export const parseBooleanConfig = (
  value: unknown,
  defaultValue = false,
): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off", ""].includes(normalized)) {
      return false;
    }
  }

  return defaultValue;
};

export const isAllowedHost = (
  baseUrl: string,
  allowedHosts: string[],
  options?: { allowInsecureHttp?: boolean },
): boolean => {
  try {
    const url = new URL(baseUrl);

    if (!["https:", "http:"].includes(url.protocol)) {
      return false;
    }

    const allowInsecureHttp = options?.allowInsecureHttp ?? false;
    if (url.protocol === "http:" && !allowInsecureHttp) {
      return false;
    }

    if (url.username || url.password) {
      return false;
    }

    const normalizedHost = url.hostname.toLowerCase();
    const normalizedHostWithPort = url.host.toLowerCase();

    return allowedHosts.some((allowedHost) => {
      const normalizedAllowedHost = allowedHost.toLowerCase();
      return (
        normalizedAllowedHost === normalizedHost ||
        normalizedAllowedHost === normalizedHostWithPort
      );
    });
  } catch {
    return false;
  }
};

export const sanitizeDetails = (
  details: string,
  apiKey?: string | null,
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

type OpenAIErrorDetailsInput = {
  payload: OpenAIErrorPayload;
  response: Pick<Response, "status" | "statusText" | "headers">;
  rawBody: string;
  apiKey?: string | null;
};

export const buildOpenAIErrorDetails = ({
  payload,
  response,
  rawBody,
  apiKey,
}: OpenAIErrorDetailsInput): string | undefined => {
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
    !errorMessage && rawBody ? `response: ${rawBody.slice(0, 300)}` : undefined,
  ].filter(Boolean);

  if (!detailParts.length) {
    return undefined;
  }

  return sanitizeDetails(detailParts.join(" | "), apiKey);
};

export const buildOpenAIUrl = (baseUrl: string, path: string): string => {
  const url = new URL(baseUrl);
  const normalizedPath = url.pathname.replace(/\/$/, "");
  url.pathname = `${normalizedPath}/${path}`;
  return url.toString();
};
