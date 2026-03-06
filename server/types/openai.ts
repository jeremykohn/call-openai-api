import type { OpenAIModel } from "../../types/models";

export type OpenAIErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
    param?: string;
  };
};

export type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ text?: string }>;
  }>;
};

export type OpenAIModelsPayload = OpenAIErrorPayload & {
  object?: string;
  data?: OpenAIModel[];
};
