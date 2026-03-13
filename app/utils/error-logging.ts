import type { NormalizedUiError } from "./error-normalization";

type ErrorLogContext = {
  source: "respond" | "models";
};

const shouldLogUiErrors = (): boolean => {
  return process.env.NODE_ENV === "development";
};

export const logNormalizedUiError = (
  normalizedError: NormalizedUiError,
  context: ErrorLogContext,
): void => {
  if (!shouldLogUiErrors()) {
    return;
  }

  console.error("UI error", {
    source: context.source,
    category: normalizedError.category,
    message: normalizedError.message,
    details: normalizedError.details,
  });
};
