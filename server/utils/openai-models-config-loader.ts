import { readFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import {
  parseOpenAIModelsConfig,
  type OpenAIModelsConfig,
  type OpenAIModelsConfigValidationResult,
} from "./openai-models-config";

export const OPENAI_MODELS_CONFIG_ASSET_KEY = "models/openai-models.json";

export type OpenAIModelsConfigLoadResult =
  | {
      mode: "config-valid";
      config: OpenAIModelsConfig;
    }
  | {
      mode: "fallback";
      reason:
        | "missing-file"
        | "unreadable-file"
        | "invalid-json"
        | "invalid-format";
      details?: OpenAIModelsConfigValidationResult extends { ok: false }
        ? OpenAIModelsConfigValidationResult["reason"]
        : string;
    };

const readConfigTextFromStorage = async (
  storageKey: string,
): Promise<{ ok: true; text: string } | { ok: false; reason: "missing-file" | "unreadable-file" }> => {
  try {
    const { useStorage } = await import("nitropack/runtime");
    const storage = useStorage("assets:server");
    const content = await storage.getItemRaw<string>(storageKey);

    if (content === null || content === undefined) {
      return { ok: false, reason: "missing-file" };
    }

    const text = typeof content === "string" ? content : String(content);
    return { ok: true, text };
  } catch {
    return { ok: false, reason: "unreadable-file" };
  }
};

const readConfigTextFromAbsolutePath = async (
  absoluteConfigPath: string,
): Promise<{ ok: true; text: string } | { ok: false; reason: "missing-file" | "unreadable-file" }> => {
  try {
    const text = await readFile(absoluteConfigPath, "utf-8");
    return { ok: true, text };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { ok: false, reason: "missing-file" };
    }

    return { ok: false, reason: "unreadable-file" };
  }
};

export const loadOpenAIModelsConfig = async (
  configPathOrStorageKey = OPENAI_MODELS_CONFIG_ASSET_KEY,
): Promise<OpenAIModelsConfigLoadResult> => {
  const readResult = isAbsolute(configPathOrStorageKey)
    ? await readConfigTextFromAbsolutePath(configPathOrStorageKey)
    : await readConfigTextFromStorage(configPathOrStorageKey);

  if (!readResult.ok) {
    return {
      mode: "fallback",
      reason: readResult.reason,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readResult.text);
  } catch {
    return {
      mode: "fallback",
      reason: "invalid-json",
    };
  }

  const validation = parseOpenAIModelsConfig(parsed);
  if (!validation.ok) {
    return {
      mode: "fallback",
      reason: "invalid-format",
      details: validation.reason,
    };
  }

  return {
    mode: "config-valid",
    config: validation.config,
  };
};
