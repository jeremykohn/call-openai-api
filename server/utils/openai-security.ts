export const parseAllowedHosts = (
  allowedHosts: string | undefined,
): string[] => {
  return (allowedHosts ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
};

export const isAllowedHost = (
  baseUrl: string,
  allowedHosts: string[],
): boolean => {
  try {
    const url = new URL(baseUrl);
    return allowedHosts.includes(url.hostname);
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

export const buildOpenAIUrl = (baseUrl: string, path: string): string => {
  const url = new URL(baseUrl);
  const normalizedPath = url.pathname.replace(/\/$/, "");
  url.pathname = `${normalizedPath}/${path}`;
  return url.toString();
};
