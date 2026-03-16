import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emitCapabilityMetrics,
  logCapabilityInfo,
  summarizeCapabilityStatuses,
} from "../../server/utils/model-capability-observability";

describe("model capability observability", () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

  afterEach(() => {
    infoSpy.mockClear();
    logSpy.mockClear();
  });

  it("summarizes capability statuses", () => {
    const summary = summarizeCapabilityStatuses({
      a: { status: "supported", checkedAt: 1, source: "probe" },
      b: { status: "unsupported", checkedAt: 1, source: "probe" },
      c: { status: "unknown", checkedAt: 1, source: "probe" },
      d: { status: "unknown", checkedAt: 1, source: "probe" },
    });

    expect(summary).toEqual({
      supported: 1,
      unsupported: 1,
      unknown: 2,
    });
  });

  it("logs info events as structured JSON", () => {
    logCapabilityInfo("models.cache.miss", {
      baseUrl: "https://api.openai.com/v1",
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(infoSpy.mock.calls[0]?.[0]));
    expect(payload.level).toBe("info");
    expect(payload.event).toBe("models.cache.miss");
  });

  it("emits metrics to stdout as JSON", () => {
    emitCapabilityMetrics({
      discovered: 10,
      probed: 10,
      supported: 6,
      unsupported: 2,
      unknown: 2,
      cacheHitRate: 0.75,
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.metric).toBe("model_capability_summary");
    expect(payload.supported).toBe(6);
  });
});
