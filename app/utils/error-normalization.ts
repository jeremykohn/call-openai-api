import {
  getErrorDetails,
  getErrorMessage,
  isApiError,
  isNetworkFetchError,
} from "./type-guards";

export type UiErrorCategory = "network" | "api" | "unknown";

export type NormalizedUiError = {
  category: UiErrorCategory;
  message: string;
  details?: string;
};

export const NETWORK_ERROR_MESSAGE =
  "Network error: Unable to reach OpenAI. Please check your internet connection and try again.";

export const API_ERROR_FALLBACK_MESSAGE = "Request to OpenAI failed.";

export const UNKNOWN_ERROR_MESSAGE =
  "An unexpected error occurred. Please try again or contact support.";

export const normalizeUiError = (error: unknown): NormalizedUiError => {
  if (isNetworkFetchError(error)) {
    return {
      category: "network",
      message: NETWORK_ERROR_MESSAGE,
    };
  }

  if (isApiError(error)) {
    return {
      category: "api",
      message: getErrorMessage(error, API_ERROR_FALLBACK_MESSAGE),
      details: getErrorDetails(error),
    };
  }

  if (error instanceof Error) {
    return {
      category: "unknown",
      message: UNKNOWN_ERROR_MESSAGE,
      details: error.message,
    };
  }

  return {
    category: "unknown",
    message: UNKNOWN_ERROR_MESSAGE,
  };
};
