import { beforeEach, describe, expect, it } from "vitest";
import {
  CAPABILITY_CACHE_TTL_MS,
  clearCapabilityCache,
  getCapabilityRecord,
  resolveModelCapability,
  setCapabilityRecord,
  setCapabilityRecords,
} from "../../server/utils/model-capability";

describe("model capability contract", () => {
  beforeEach(() => {
    clearCapabilityCache();
  });

  it("returns fallback unknown for empty model id", () => {
    const now = 1_700_000_000_000;
    const result = resolveModelCapability({ modelId: "   ", now });

    expect(result).toEqual({
      status: "unknown",
      checkedAt: now,
      source: "fallback",
      errorCode: "invalid_model_id",
    });
  });

  it("applies override precedence over probe and cache", () => {
    const now = 1_700_000_000_000;

    setCapabilityRecord("gpt-4.1-mini", {
      status: "supported",
      checkedAt: now - 100,
      source: "probe",
    });

    const result = resolveModelCapability({
      modelId: "gpt-4.1-mini",
      now,
      overrides: {
        allowed_models: [],
        disallowed_models: ["gpt-4.1-mini"],
      },
      probeRecord: {
        status: "supported",
        checkedAt: now,
        source: "probe",
      },
    });

    expect(result).toEqual({
      status: "unsupported",
      checkedAt: now,
      source: "override-disallow",
    });
  });

  it("resolves from fresh cache when no override/probe exists", () => {
    const now = 1_700_000_000_000;
    setCapabilityRecord("gpt-4o", {
      status: "supported",
      checkedAt: now - 1_000,
      source: "probe",
    });

    const result = resolveModelCapability({ modelId: "gpt-4o", now });
    expect(result.status).toBe("supported");
    expect(result.source).toBe("cache");
  });

  it("falls back to unknown when cache is stale", () => {
    const now = 1_700_000_000_000;
    setCapabilityRecord("gpt-4o", {
      status: "supported",
      checkedAt: now - CAPABILITY_CACHE_TTL_MS - 1,
      source: "probe",
    });

    const result = resolveModelCapability({ modelId: "gpt-4o", now });
    expect(result).toEqual({
      status: "unknown",
      checkedAt: now,
      source: "fallback",
    });
  });

  it("stores and returns probe results", () => {
    const now = 1_700_000_000_000;
    const probeRecord = {
      status: "unsupported" as const,
      checkedAt: now,
      source: "probe" as const,
      errorCode: "model_not_found",
    };

    const result = resolveModelCapability({
      modelId: "gpt-image-1.5",
      now,
      probeRecord,
    });

    expect(result).toEqual(probeRecord);
    expect(getCapabilityRecord("gpt-image-1.5")).toEqual(probeRecord);
  });

  it("ignores malformed records when bulk-loading cache", () => {
    setCapabilityRecords({
      "gpt-4.1-mini": {
        status: "supported",
        checkedAt: 1_700_000_000_000,
        source: "probe",
      },
      "gpt-image-1.5": {
        status: "supported",
        source: "probe",
      },
      "": {
        status: "unsupported",
        checkedAt: 1,
        source: "probe",
      },
    });

    expect(getCapabilityRecord("gpt-4.1-mini")?.status).toBe("supported");
    expect(getCapabilityRecord("gpt-image-1.5")).toBeNull();
    expect(getCapabilityRecord("")).toBeNull();
  });
});
