import type { OpenAIModel } from "../../types/models";
import { DEFAULT_MODEL } from "../../shared/constants/models";
import { HTTP_STATUS } from "../constants/http-status";
import { buildOpenAIUrl } from "./openai-security";

const MODELS_PATH = "models";

type ModelResolutionError = {
  error: string;
  statusCode: 400 | 502;
};

export type ModelResolutionResult = { model: string } | ModelResolutionError;

const fetchAvailableModels = async (
  apiKey: string,
  baseUrl: string,
): Promise<string[] | null> => {
  try {
    const response = await fetch(buildOpenAIUrl(baseUrl, MODELS_PATH), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: OpenAIModel[] };
    return (payload.data ?? []).map((model) => model.id);
  } catch {
    return null;
  }
};

export const resolveModel = async (
  requestedModel: string | undefined,
  apiKey: string,
  baseUrl: string,
): Promise<ModelResolutionResult> => {
  if (!requestedModel || requestedModel.trim() === "") {
    return { model: DEFAULT_MODEL };
  }

  const availableModels = await fetchAvailableModels(apiKey, baseUrl);

  if (availableModels === null) {
    return {
      error: "Unable to validate model right now. Please try again.",
      statusCode: HTTP_STATUS.BAD_GATEWAY,
    };
  }

  if (!availableModels.includes(requestedModel)) {
    return {
      error: "Model is not valid",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    };
  }

  return { model: requestedModel };
};
