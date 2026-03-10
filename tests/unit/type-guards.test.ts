import { describe, it, expect } from "vitest";
import {
  isErrorWithMessage,
  isNetworkFetchError,
  isApiError,
  getErrorMessage,
  getErrorDetails,
} from "~/utils/type-guards";

describe("Type Guards", () => {
  describe("isErrorWithMessage", () => {
    it("returns true for objects with string message property", () => {
      const error = { message: "Something went wrong" };
      expect(isErrorWithMessage(error)).toBe(true);
    });

    it("returns true for Error instances", () => {
      const error = new Error("Test error");
      expect(isErrorWithMessage(error)).toBe(true);
    });

    it("returns false for objects without message property", () => {
      const error = { code: 500 };
      expect(isErrorWithMessage(error)).toBe(false);
    });

    it("returns false for objects with non-string message", () => {
      const error = { message: 123 };
      expect(isErrorWithMessage(error)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isErrorWithMessage(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isErrorWithMessage(undefined)).toBe(false);
    });

    it("returns false for primitives", () => {
      expect(isErrorWithMessage("error string")).toBe(false);
      expect(isErrorWithMessage(123)).toBe(false);
    });
  });

  describe("isNetworkFetchError", () => {
    it("returns true for TypeError with fetch keyword", () => {
      const error = new TypeError("fetch failed");
      expect(isNetworkFetchError(error)).toBe(true);
    });

    it("returns true for TypeError with network keyword", () => {
      const error = new TypeError("Network request failed");
      expect(isNetworkFetchError(error)).toBe(true);
    });

    it("returns false for TypeError without fetch/network keywords", () => {
      const error = new TypeError("Invalid argument");
      expect(isNetworkFetchError(error)).toBe(false);
    });

    it("returns false for objects with status code", () => {
      const error = { status: 500, message: "Server error" };
      expect(isNetworkFetchError(error)).toBe(false);
    });

    it("returns false for objects with statusCode", () => {
      const error = { statusCode: 404, message: "Not found" };
      expect(isNetworkFetchError(error)).toBe(false);
    });

    it("returns true for objects with network-related message and no status", () => {
      const error = { message: "no response from server" };
      expect(isNetworkFetchError(error)).toBe(true);
    });

    it("returns false for objects without network keywords", () => {
      const error = { message: "Invalid input" };
      expect(isNetworkFetchError(error)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isNetworkFetchError(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isNetworkFetchError(undefined)).toBe(false);
    });
  });

  describe("isApiError", () => {
    it("returns true for objects with data property containing error details", () => {
      const error = {
        data: { message: "API error", details: "Invalid token" },
      };
      expect(isApiError(error)).toBe(true);
    });

    it("returns true for objects with empty data object", () => {
      const error = { data: {} };
      expect(isApiError(error)).toBe(true);
    });

    it("returns false for objects without data property", () => {
      const error = { message: "Error" };
      expect(isApiError(error)).toBe(false);
    });

    it("returns false for objects with null data", () => {
      const error = { data: null };
      expect(isApiError(error)).toBe(false);
    });

    it("returns false for objects with non-object data", () => {
      const error = { data: "string data" };
      expect(isApiError(error)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isApiError(null)).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    it("extracts message from error with message property", () => {
      const error = { message: "Test error" };
      expect(getErrorMessage(error)).toBe("Test error");
    });

    it("extracts message from Error instance", () => {
      const error = new Error("Error instance message");
      expect(getErrorMessage(error)).toBe("Error instance message");
    });

    it("extracts message from API error", () => {
      const error = { data: { message: "API error message" } };
      expect(getErrorMessage(error)).toBe("API error message");
    });

    it("returns fallback for unknown error types", () => {
      expect(getErrorMessage("string error")).toBe("An error occurred");
      expect(getErrorMessage(123)).toBe("An error occurred");
      expect(getErrorMessage(null)).toBe("An error occurred");
    });

    it("uses custom fallback when provided", () => {
      expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
    });

    it("prioritizes API error message over generic error message", () => {
      const error = {
        message: "Generic message",
        data: { message: "API specific message" },
      };
      expect(getErrorMessage(error)).toBe("API specific message");
    });
  });

  describe("getErrorDetails", () => {
    it("extracts details from API error", () => {
      const error = { data: { details: "Detailed error info" } };
      expect(getErrorDetails(error)).toBe("Detailed error info");
    });

    it("returns undefined for API error without details", () => {
      const error = { data: { message: "Error" } };
      expect(getErrorDetails(error)).toBeUndefined();
    });

    it("returns undefined for non-API errors", () => {
      expect(getErrorDetails(new Error("Test"))).toBeUndefined();
      expect(getErrorDetails({ message: "Test" })).toBeUndefined();
      expect(getErrorDetails(null)).toBeUndefined();
    });

    it("handles nested data structures", () => {
      const error = {
        data: {
          message: "Error occurred",
          details: "Stack trace here",
        },
      };
      expect(getErrorDetails(error)).toBe("Stack trace here");
    });
  });
});
