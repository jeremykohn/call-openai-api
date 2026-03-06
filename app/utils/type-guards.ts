/**
 * Type guard utilities for runtime type checking.
 * These helpers provide type-safe error handling and validation.
 */

/**
 * Checks if a value is an Error instance with a message property.
 */
export function isErrorWithMessage(
  error: unknown,
): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Checks if a value is a fetch error (network-related).
 * Detects TypeErrors with fetch/network keywords or objects without HTTP status codes.
 */
export function isNetworkFetchError(error: unknown): boolean {
  const networkErrorCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ETIMEDOUT",
    "UND_ERR_CONNECT_TIMEOUT",
  ]);

  if (error instanceof TypeError) {
    return /fetch|network/i.test(error.message);
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      name?: string;
      message?: string;
      status?: number;
      statusCode?: number;
      code?: string;
      cause?: { code?: string; name?: string; message?: string };
    };

    // If it has a status code, it's an HTTP error, not a network error
    if (typeof maybeError.status === "number") {
      return false;
    }

    if (typeof maybeError.statusCode === "number") {
      return false;
    }

    if (
      (typeof maybeError.code === "string" &&
        networkErrorCodes.has(maybeError.code)) ||
      (typeof maybeError.cause?.code === "string" &&
        networkErrorCodes.has(maybeError.cause.code))
    ) {
      return true;
    }

    if (
      maybeError.name === "AbortError" ||
      maybeError.cause?.name === "AbortError"
    ) {
      return true;
    }

    // Check message for network-related keywords
    return /fetch|network|no response|timed out|failed to connect/i.test(
      [maybeError.message, maybeError.cause?.message].filter(Boolean).join(" "),
    );
  }

  return false;
}

/**
 * Checks if an error object has a data property with API error details.
 */
export function isApiError(
  error: unknown,
): error is { data?: { message?: string; details?: string } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data: unknown }).data === "object" &&
    (error as { data: unknown }).data !== null
  );
}

/**
 * Extracts error message from various error types.
 * Returns a fallback message if extraction fails.
 * Prioritizes API error messages over generic error messages.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "An error occurred",
): string {
  // Check API error first (most specific)
  if (isApiError(error) && error.data?.message) {
    return error.data.message;
  }

  // Then check for message property
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  // Then check Error instance
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/**
 * Extracts error details from API errors.
 */
export function getErrorDetails(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.data?.details;
  }

  return undefined;
}
