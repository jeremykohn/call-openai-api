const API_KEY_PATTERN = /sk-[A-Za-z0-9_-]{8,}/g;
const BEARER_TOKEN_PATTERN = /Bearer\s+[A-Za-z0-9._+/=-]+/gi;
const AUTH_HEADER_PATTERN = /(Authorization\s*:\s*)[^\r\n]+/gi;

export const sanitizeErrorText = (value: string): string => {
  return value
    .replace(BEARER_TOKEN_PATTERN, "Bearer [REDACTED]")
    .replace(AUTH_HEADER_PATTERN, "$1[REDACTED]")
    .replace(API_KEY_PATTERN, "[REDACTED]");
};

export const sanitizeOptionalErrorText = (
  value?: string,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  return sanitizeErrorText(value);
};
