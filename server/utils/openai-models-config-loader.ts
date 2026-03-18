import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseOpenAIModelsConfig,
  type OpenAIModelsConfig,
  type OpenAIModelsConfigValidationResult,
} from "./openai-models-config";

export const OPENAI_MODELS_CONFIG_RELATIVE_PATH =
  "server/config/models/openai-models.json";

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

const toAbsoluteConfigPath = (configPath: string): string => {
  return resolve(process.cwd(), configPath);
};

export const loadOpenAIModelsConfig = async (
  configPath = OPENAI_MODELS_CONFIG_RELATIVE_PATH,
): Promise<OpenAIModelsConfigLoadResult> => {
  const absoluteConfigPath = toAbsoluteConfigPath(configPath);

  let fileText: string;
  try {
    fileText = await readFile(absoluteConfigPath, "utf-8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return {
        mode: "fallback",
        reason: "missing-file",
      };
    }

    return {
      mode: "fallback",
      reason: "unreadable-file",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText);
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
