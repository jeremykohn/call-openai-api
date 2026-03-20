import { describe, expect, it } from "vitest";
import {
  sanitizeErrorText,
  sanitizeOptionalErrorText,
} from "../../app/utils/error-sanitization";

describe("sanitizeErrorText", () => {
  it("redacts OpenAI-style API keys", () => {
    const value = "failed with sk-secret_1234567890 token";

    const sanitized = sanitizeErrorText(value);

    expect(sanitized).not.toContain("sk-secret_1234567890");
    expect(sanitized).toContain("[REDACTED]");
  });

  it("redacts bearer tokens", () => {
    const value = "Authorization failed: Bearer abc.def-ghi_123";

    const sanitized = sanitizeErrorText(value);

    expect(sanitized).not.toContain("Bearer abc.def-ghi_123");
    expect(sanitized).toContain("Bearer [REDACTED]");
  });

  it("redacts full authorization header values until line end", () => {
    const value =
      "headers: Authorization: Bearer sk-secret_1234567890 extra-info\nnext: value";

    const sanitized = sanitizeErrorText(value);

    expect(sanitized).toContain("Authorization: [REDACTED]");
    expect(sanitized).not.toContain("sk-secret_1234567890");
    expect(sanitized).not.toContain("extra-info");
    expect(sanitized).toContain("\nnext: value");
  });

  it("redacts authorization header case-insensitively", () => {
    const value = "authorization: Basic abc123";

    const sanitized = sanitizeErrorText(value);

    expect(sanitized).toContain("authorization: [REDACTED]");
    expect(sanitized).not.toContain("Basic abc123");
  });

  it("redacts multiple sensitive values in one string", () => {
    const value =
      "Authorization: Bearer token-1 and sk-secret_1234567890 plus Bearer token-2";

    const sanitized = sanitizeErrorText(value);

    expect(sanitized).not.toContain("token-1");
    expect(sanitized).not.toContain("token-2");
    expect(sanitized).not.toContain("sk-secret_1234567890");
  });
});

describe("sanitizeOptionalErrorText", () => {
  it("returns undefined for undefined input", () => {
    expect(sanitizeOptionalErrorText(undefined)).toBeUndefined();
  });

  it("sanitizes non-empty input", () => {
    expect(sanitizeOptionalErrorText("Bearer x.y.z")).toBe("Bearer [REDACTED]");
  });
});

describe("sanitizeErrorText: extended bearer token formats", () => {
  it("redacts base64-encoded bearer tokens containing + and /", () => {
    const value = "Authorization: Bearer dGVzdDp0ZXN0/dGVzdA==";

    const sanitized = sanitizeErrorText(value);

    expect(sanitized).not.toContain("dGVzdDp0ZXN0/dGVzdA==");
    // Bearer is redacted first; auth header pattern then normalises the rest
    expect(sanitized).toContain("[REDACTED]");
    expect(sanitized).not.toContain("dGVzdA==");
  });

  it("redacts bearer tokens containing + characters", () => {
    const value = "token: Bearer abc+def+ghi";

    const sanitized = sanitizeErrorText(value);

    expect(sanitized).not.toContain("abc+def+ghi");
    expect(sanitized).toContain("Bearer [REDACTED]");
  });

  it("redacts opaque bearer tokens with = padding", () => {
    const value = "Bearer dGVzdA==";

    const sanitized = sanitizeErrorText(value);

    expect(sanitized).not.toContain("dGVzdA==");
    expect(sanitized).toContain("Bearer [REDACTED]");
  });
});
