import { describe, expect, it, vi } from "vitest";
import {
  PROBE_MAX_OUTPUT_TOKENS,
  classifyProbeResult,
  discoverModelCandidates,
  probeModelCapability,
} from "../../server/utils/model-capability-discovery";

describe("model capability discovery", () => {
  it("extracts unique candidate model ids from OpenAI models payload", () => {
    const candidates = discoverModelCandidates({
      data: [
        { id: "gpt-4.1-mini", object: "model", created: 1, owned_by: "openai" },
        { id: "gpt-4.1-mini", object: "model", created: 2, owned_by: "openai" },
        { id: "  o3-mini ", object: "model", created: 3, owned_by: "openai" },
      ],
    });

    expect(candidates).toEqual(["gpt-4.1-mini", "o3-mini"]);
  });

  it("classifies successful probe as supported", () => {
    expect(classifyProbeResult(200, {})).toEqual({ status: "supported" });
  });

  it("classifies known 400 model incompatibility as unsupported", () => {
    const result = classifyProbeResult(400, {
      error: {
        type: "invalid_request_error",
        code: "model_not_found",
        param: "model",
      },
    });

    expect(result).toEqual({
      status: "unsupported",
      errorCode: "model_not_found",
    });
  });

  it("uses hardcoded probe payload and max_output_tokens=16", async () => {
    const fetchMock = vi.fn(async () => ({
      status: 200,
      json: async () => ({}),
    }));

    await probeModelCapability({
      modelId: "gpt-4.1-mini",
      apiKey: "test-key",
      baseUrl: "https://api.openai.test/v1",
      fetchImpl: fetchMock as unknown as typeof fetch,
      now: 1_700_000_000_000,
    });

    const firstCallArgs = fetchMock.mock.calls.at(0) as unknown[] | undefined;
    expect(firstCallArgs).toBeDefined();

    const init = firstCallArgs?.[1] as RequestInit | undefined;
    expect(init).toBeDefined();

    const body = JSON.parse(String(init?.body));
    expect(body.input).toBe("a");
    expect(body.max_output_tokens).toBe(PROBE_MAX_OUTPUT_TOKENS);
  });

  it("classifies timeout probe as unknown", async () => {
    const neverResolvingFetch = vi.fn(
      () => new Promise(() => undefined),
    ) as unknown as typeof fetch;

    const result = await probeModelCapability({
      modelId: "gpt-4.1-mini",
      apiKey: "test-key",
      baseUrl: "https://api.openai.test/v1",
      fetchImpl: neverResolvingFetch,
      timeoutMs: 5,
      now: 1_700_000_000_000,
    });

    expect(result.status).toBe("unknown");
    expect(result.errorCode).toBe("probe_timeout");
  });

  it("classifies non-model invalid_request_error payloads as unknown", () => {
    const result = classifyProbeResult(400, {
      error: {
        type: "invalid_request_error",
        code: "integer_below_min_value",
        param: "max_output_tokens",
      },
    });

    expect(result).toEqual({
      status: "unknown",
      errorCode: "integer_below_min_value",
    });
  });
});
