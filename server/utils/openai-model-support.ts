import type { OpenAIModel } from "../../types/models";

const UNSUPPORTED_RESPONSES_MODEL_ID_PATTERN =
  /(^|[-_])(transcribe|tts)([-_]|$)/i;

export const isResponsesApiSupportedModel = (modelId: string): boolean => {
  if (!modelId.trim()) {
    return false;
  }

  if (/^whisper-/i.test(modelId)) {
    return false;
  }

  return !UNSUPPORTED_RESPONSES_MODEL_ID_PATTERN.test(modelId);
};

export const filterResponsesApiSupportedModels = (
  models: ReadonlyArray<OpenAIModel>,
): OpenAIModel[] => {
  return models.filter((model) => isResponsesApiSupportedModel(model.id));
};
