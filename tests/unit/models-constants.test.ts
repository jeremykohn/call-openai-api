import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODEL,
  MODELS_FALLBACK_NOTE_TEXT,
} from "~~/shared/constants/models";

describe("shared model constants", () => {
  it("defines the default model", () => {
    expect(DEFAULT_MODEL).toBe("gpt-4.1-mini");
  });

  it("defines the exact fallback note text", () => {
    expect(MODELS_FALLBACK_NOTE_TEXT).toBe(
      "Note: List of OpenAI models may include some older models that are no longer available.",
    );
  });
});
