import { readFileSync } from "node:fs";
import path from "node:path";
import type { AllowedModelsOverrides } from "./model-capability";

export const OVERRIDES_CONFIG_PATH = path.resolve(
  process.cwd(),
  "server/config/allowed-models-overrides.json",
);

const normalizeModelIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    throw new Error("Override list must be an array");
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
};

export const parseAllowedModelsOverrides = (
  value: unknown,
): AllowedModelsOverrides => {
  if (!value || typeof value !== "object") {
    throw new Error("Overrides config must be an object");
  }

  const parsed = value as {
    allowed_models?: unknown;
    disallowed_models?: unknown;
  };

  return {
    allowed_models: normalizeModelIds(parsed.allowed_models),
    disallowed_models: normalizeModelIds(parsed.disallowed_models),
  };
};

export const loadAllowedModelsOverrides = (
  filePath = OVERRIDES_CONFIG_PATH,
): AllowedModelsOverrides => {
  const raw = readFileSync(filePath, "utf8");
  const payload = JSON.parse(raw) as unknown;
  return parseAllowedModelsOverrides(payload);
};
