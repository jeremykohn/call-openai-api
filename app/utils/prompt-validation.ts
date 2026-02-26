import type { PromptValidationResult } from "../../types/chat";

const EMPTY_PROMPT_MESSAGE = "Please enter a prompt.";
const MAX_PROMPT_LENGTH = 4000;
const MAX_PROMPT_MESSAGE = `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`;

export const validatePrompt = (input: string): PromptValidationResult => {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, error: EMPTY_PROMPT_MESSAGE };
  }

  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return { ok: false, error: MAX_PROMPT_MESSAGE };
  }

  return { ok: true, prompt: trimmed };
};
