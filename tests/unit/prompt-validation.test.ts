import { describe, expect, it } from "vitest";
import { validatePrompt } from "../../app/utils/prompt-validation";

describe("validatePrompt", () => {
  it("rejects empty prompt", () => {
    const result = validatePrompt("");

    expect(result.ok).toBe(false);
  });

  it("rejects whitespace-only prompt", () => {
    const result = validatePrompt("   \n\t  ");

    expect(result.ok).toBe(false);
  });

  it("accepts valid prompt and trims whitespace", () => {
    const result = validatePrompt("  Hello, world!  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prompt).toBe("Hello, world!");
    }
  });
});
