import type {
  OpenAIErrorPayload,
  OpenAIResponsePayload,
} from "../types/openai";

export const parseOpenAIResponseBody = (
  rawBody: string,
): OpenAIResponsePayload & OpenAIErrorPayload => {
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as OpenAIResponsePayload & OpenAIErrorPayload;
  } catch {
    return {};
  }
};

export const extractOutputText = (response: OpenAIResponsePayload): string => {
  if (response.output_text) {
    return response.output_text;
  }

  const first = response.output?.[0]?.content?.[0]?.text;
  return first ?? "";
};
