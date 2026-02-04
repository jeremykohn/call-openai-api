import type { PromptValidationResult } from "../../types/chat";

const EMPTY_PROMPT_MESSAGE = "Please enter a prompt.";

export const validatePrompt = (input: string): PromptValidationResult => {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, error: EMPTY_PROMPT_MESSAGE };
  }

  return { ok: true, prompt: trimmed };
};
