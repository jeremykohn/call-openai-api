import { describe, expect, it } from "vitest";
import type { OpenAIModel } from "../../types/models";
import {
  clearCachedModelsResponse,
  isModelsRefreshInFlight,
  readCachedModelsResponse,
  triggerCachedModelsBackgroundRefresh,
  writeCachedModelsResponse,
} from "../../server/utils/model-capability-models-cache";
import { CAPABILITY_CACHE_TTL_MS } from "../../server/utils/model-capability";

describe("model capability models cache", () => {
  const baseUrl = "https://api.openai.test/v1";
  const staleModels: OpenAIModel[] = [
    {
      id: "stale-model",
      object: "model",
      created: 1,
      owned_by: "openai",
    },
  ];

  it("marks cached models as fresh within 24h TTL", () => {
    clearCachedModelsResponse();
    const now = 1_700_000_000_000;
    writeCachedModelsResponse(baseUrl, staleModels, now - 1_000);

    const cached = readCachedModelsResponse(baseUrl, now);
    expect(cached?.fresh).toBe(true);
    expect(cached?.models[0]?.id).toBe("stale-model");
  });

  it("marks cached models as stale after 24h TTL", () => {
    clearCachedModelsResponse();
    const now = 1_700_000_000_000;
    writeCachedModelsResponse(baseUrl, staleModels, now - CAPABILITY_CACHE_TTL_MS - 1);

    const cached = readCachedModelsResponse(baseUrl, now);
    expect(cached?.fresh).toBe(false);
    expect(cached?.models[0]?.id).toBe("stale-model");
  });

  it("returns stale data immediately and refreshes in background", async () => {
    clearCachedModelsResponse();
    const now = 1_700_000_000_000;
    writeCachedModelsResponse(baseUrl, staleModels, now - CAPABILITY_CACHE_TTL_MS - 1);

    const staleRead = readCachedModelsResponse(baseUrl, now);
    expect(staleRead?.fresh).toBe(false);
    expect(staleRead?.models[0]?.id).toBe("stale-model");

    triggerCachedModelsBackgroundRefresh(baseUrl, async () => [
      {
        id: "fresh-model",
        object: "model",
        created: 2,
        owned_by: "openai",
      },
    ]);

    expect(isModelsRefreshInFlight(baseUrl)).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 5));

    const refreshed = readCachedModelsResponse(baseUrl, now + 10);
    expect(refreshed?.models[0]?.id).toBe("fresh-model");
    expect(isModelsRefreshInFlight(baseUrl)).toBe(false);
  });
});
