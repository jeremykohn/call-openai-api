import { describe, it, expect } from "vitest";
import {
  parseAllowedHosts,
  isAllowedHost,
  buildOpenAIUrl,
} from "../../server/utils/openai-security";

describe("OpenAI Security Utils", () => {
  describe("parseAllowedHosts", () => {
    it("parses comma-separated hostnames", () => {
      expect(parseAllowedHosts("api.openai.com,example.com")).toEqual([
        "api.openai.com",
        "example.com",
      ]);
    });

    it("trims whitespace and removes empty values", () => {
      expect(parseAllowedHosts(" api.openai.com , , 127.0.0.1:3000 ")).toEqual([
        "api.openai.com",
        "127.0.0.1:3000",
      ]);
    });

    it("returns empty array for undefined input", () => {
      expect(parseAllowedHosts(undefined)).toEqual([]);
    });
  });

  describe("isAllowedHost", () => {
    it("accepts matching HTTPS hostname", () => {
      expect(isAllowedHost("https://api.openai.com/v1", ["api.openai.com"])).toBe(
        true,
      );
    });

    it("rejects HTTP by default", () => {
      expect(isAllowedHost("http://api.openai.com/v1", ["api.openai.com"])).toBe(
        false,
      );
    });

    it("accepts HTTP when explicitly allowed", () => {
      expect(
        isAllowedHost("http://127.0.0.1:3000/v1", ["127.0.0.1:3000"], {
          allowInsecureHttp: true,
        }),
      ).toBe(true);
    });

    it("matches allowlist entries with host and port", () => {
      expect(
        isAllowedHost("https://api.openai.com:8443/v1", ["api.openai.com:8443"]),
      ).toBe(true);
    });

    it("rejects credentialed URLs", () => {
      expect(
        isAllowedHost("https://user:pass@api.openai.com/v1", ["api.openai.com"]),
      ).toBe(false);
    });

    it("rejects non-http protocols", () => {
      expect(isAllowedHost("ftp://api.openai.com/v1", ["api.openai.com"])).toBe(
        false,
      );
    });

    it("returns false for malformed URL", () => {
      expect(isAllowedHost("not-a-url", ["api.openai.com"])).toBe(false);
    });
  });

  describe("buildOpenAIUrl", () => {
    it("appends path to base URL", () => {
      expect(buildOpenAIUrl("https://api.openai.com/v1", "models")).toBe(
        "https://api.openai.com/v1/models",
      );
    });

    it("handles trailing slash in base path", () => {
      expect(buildOpenAIUrl("https://api.openai.com/v1/", "responses")).toBe(
        "https://api.openai.com/v1/responses",
      );
    });

    it("preserves query parameters", () => {
      expect(buildOpenAIUrl("https://example.com/base?x=1", "models")).toBe(
        "https://example.com/base/models?x=1",
      );
    });
  });
});
