import { describe, it, expect } from "vitest";
import {
  parseAllowedHosts,
  parseBooleanConfig,
  isAllowedHost,
  buildOpenAIUrl,
  validateOpenAIConfig,
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

    it("extracts hostname from full URLs", () => {
      expect(
        parseAllowedHosts(
          "https://api.openai.com, http://example.com:8080, 127.0.0.1",
        ),
      ).toEqual(["api.openai.com", "example.com", "127.0.0.1"]);
    });

    it("returns empty array for undefined input", () => {
      expect(parseAllowedHosts(undefined)).toEqual([]);
    });
  });

  describe("parseBooleanConfig", () => {
    it("parses truthy string variants", () => {
      expect(parseBooleanConfig("true")).toBe(true);
      expect(parseBooleanConfig("TRUE")).toBe(true);
      expect(parseBooleanConfig("1")).toBe(true);
      expect(parseBooleanConfig("yes")).toBe(true);
      expect(parseBooleanConfig("on")).toBe(true);
    });

    it("parses falsy string variants", () => {
      expect(parseBooleanConfig("false")).toBe(false);
      expect(parseBooleanConfig("FALSE")).toBe(false);
      expect(parseBooleanConfig("0")).toBe(false);
      expect(parseBooleanConfig("no")).toBe(false);
      expect(parseBooleanConfig("off")).toBe(false);
      expect(parseBooleanConfig(" ")).toBe(false);
    });

    it("returns default for unsupported values", () => {
      expect(parseBooleanConfig("maybe")).toBe(false);
      expect(parseBooleanConfig("maybe", true)).toBe(true);
      expect(parseBooleanConfig(undefined, true)).toBe(true);
      expect(parseBooleanConfig(123, true)).toBe(true);
    });

    it("returns booleans unchanged", () => {
      expect(parseBooleanConfig(true)).toBe(true);
      expect(parseBooleanConfig(false)).toBe(false);
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
  });

  describe("validateOpenAIConfig", () => {
    it("returns valid for complete config", () => {
      const result = validateOpenAIConfig({
        apiKey: "sk_test_123",
        allowedHosts: ["api.openai.com"],
        allowInsecureHttp: false,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects empty API key", () => {
      const result = validateOpenAIConfig({
        apiKey: "",
        allowedHosts: ["api.openai.com"],
        allowInsecureHttp: false,
      });

      expect(result.valid).toBe(false);
      expect(result.valid === false && result.reason).toContain("OPENAI_API_KEY");
    });

    it("rejects whitespace-only API key", () => {
      const result = validateOpenAIConfig({
        apiKey: "   ",
        allowedHosts: ["api.openai.com"],
        allowInsecureHttp: false,
      });

      expect(result.valid).toBe(false);
      expect(result.valid === false && result.reason).toContain("OPENAI_API_KEY");
    });

    it("rejects empty allowed hosts list", () => {
      const result = validateOpenAIConfig({
        apiKey: "sk_test_123",
        allowedHosts: [],
        allowInsecureHttp: false,
      });

      expect(result.valid).toBe(false);
      expect(result.valid === false && result.reason).toContain("OPENAI_ALLOWED_HOSTS");
    });

    it("preserves query parameters", () => {
      expect(buildOpenAIUrl("https://example.com/base?x=1", "models")).toBe(
        "https://example.com/base/models?x=1",
      );
    });
  });
});
