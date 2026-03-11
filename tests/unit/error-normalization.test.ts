import { describe, expect, it } from "vitest";
import {
  API_ERROR_FALLBACK_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
  normalizeUiError,
} from "~/utils/error-normalization";

describe("normalizeUiError", () => {
  it("categorizes network errors and uses canonical network message", () => {
    const result = normalizeUiError(new TypeError("Failed to fetch"));

    expect(result.category).toBe("network");
    expect(result.message).toBe(NETWORK_ERROR_MESSAGE);
    expect(result.details).toBeUndefined();
  });

  it("categorizes API errors and surfaces specific API message", () => {
    const result = normalizeUiError({
      data: {
        message: "Invalid API key. Please check your key and try again.",
        details: "status: 401",
      },
    });

    expect(result.category).toBe("api");
    expect(result.message).toBe(
      "Invalid API key. Please check your key and try again.",
    );
    expect(result.details).toBe("status: 401");
  });

  it("uses API fallback when API error message is missing", () => {
    const result = normalizeUiError({ data: { details: "status: 400" } });

    expect(result.category).toBe("api");
    expect(result.message).toBe(API_ERROR_FALLBACK_MESSAGE);
    expect(result.details).toBe("status: 400");
  });

  it("categorizes unknown errors and uses canonical unknown message", () => {
    const result = normalizeUiError(new Error("unexpected runtime issue"));

    expect(result.category).toBe("unknown");
    expect(result.message).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(result.details).toBe("unexpected runtime issue");
  });

  it("handles nullish and non-object errors with unknown fallback", () => {
    expect(normalizeUiError(null)).toEqual({
      category: "unknown",
      message: UNKNOWN_ERROR_MESSAGE,
      details: undefined,
    });

    expect(normalizeUiError("boom")).toEqual({
      category: "unknown",
      message: UNKNOWN_ERROR_MESSAGE,
      details: undefined,
    });
  });
});
