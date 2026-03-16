import { describe, expect, it, vi } from "vitest";
import { probeModelCapabilities } from "../../server/utils/model-capability-discovery";

describe("model capability discovery integration", () => {
  it("builds a capability map from mixed probe outcomes", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { model: string };

      if (body.model === "gpt-4.1-mini") {
        return {
          status: 200,
          json: async () => ({}),
        };
      }

      if (body.model === "dall-e-3") {
        return {
          status: 400,
          json: async () => ({
            error: {
              type: "invalid_request_error",
              code: "model_not_found",
              param: "model",
            },
          }),
        };
      }

      return {
        status: 503,
        json: async () => ({ error: { code: "service_unavailable" } }),
      };
    });

    const result = await probeModelCapabilities({
      modelIds: ["gpt-4.1-mini", "dall-e-3", "text-embedding-ada-002"],
      apiKey: "test-key",
      baseUrl: "https://api.openai.test/v1",
      fetchImpl: fetchMock as unknown as typeof fetch,
      now: 1_700_000_000_000,
    });

    expect(result["gpt-4.1-mini"]).toBeDefined();
    expect(result["dall-e-3"]).toBeDefined();
    expect(result["text-embedding-ada-002"]).toBeDefined();

    expect(result["gpt-4.1-mini"]!.status).toBe("supported");
    expect(result["dall-e-3"]!.status).toBe("unsupported");
    expect(result["text-embedding-ada-002"]!.status).toBe("unknown");
  });

  it("classifies transient thrown failures as unknown", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { model: string };
      if (body.model === "gpt-4.1-mini") {
        return {
          status: 200,
          json: async () => ({}),
        };
      }

      throw new Error("ECONNRESET");
    });

    const result = await probeModelCapabilities({
      modelIds: ["gpt-4.1-mini", "o3-mini"],
      apiKey: "test-key",
      baseUrl: "https://api.openai.test/v1",
      fetchImpl: fetchMock as unknown as typeof fetch,
      now: 1_700_000_000_000,
    });

    expect(result["gpt-4.1-mini"]).toBeDefined();
    expect(result["o3-mini"]).toBeDefined();

    expect(result["gpt-4.1-mini"]!.status).toBe("supported");
    expect(result["o3-mini"]!.status).toBe("unknown");
    expect(result["o3-mini"]!.errorCode).toBe("probe_failed");
  });
});
