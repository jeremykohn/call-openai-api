import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  logNormalizedUiError,
} from "../../app/utils/error-logging";
import type { NormalizedUiError } from "../../app/utils/error-normalization";

describe("logNormalizedUiError", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  const sampleError: NormalizedUiError = {
    category: "api",
    message: "Request to OpenAI failed.",
    details: "status: 400",
  };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("logs normalized UI errors in development", () => {
    process.env.NODE_ENV = "development";

    logNormalizedUiError(sampleError, { source: "respond" });

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith("UI error", {
      source: "respond",
      category: "api",
      message: "Request to OpenAI failed.",
      details: "status: 400",
    });
  });

  it("does not log normalized UI errors outside development", () => {
    process.env.NODE_ENV = "test";

    logNormalizedUiError(sampleError, { source: "models" });

    expect(console.error).not.toHaveBeenCalled();
  });
});
