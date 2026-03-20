import { describe, expect, it } from "vitest";
import {
  filterResponsesApiSupportedModels,
  isResponsesApiSupportedModel,
} from "../../server/utils/openai-model-support";
import type { OpenAIModel } from "../../types/models";

describe("openai-model-support", () => {
  describe("isResponsesApiSupportedModel", () => {
    it("returns false for empty model id", () => {
      expect(isResponsesApiSupportedModel("")).toBe(false);
      expect(isResponsesApiSupportedModel("   ")).toBe(false);
    });

    it("returns false for transcription and tts model ids", () => {
      expect(
        isResponsesApiSupportedModel("gpt-4o-mini-transcribe-2025-12-15"),
      ).toBe(false);
      expect(isResponsesApiSupportedModel("gpt-4o-transcribe")).toBe(false);
      expect(isResponsesApiSupportedModel("gpt-4o-mini-tts")).toBe(false);
      expect(isResponsesApiSupportedModel("whisper-1")).toBe(false);
    });

    it("returns true for standard text generation model ids", () => {
      expect(isResponsesApiSupportedModel("gpt-4.1-mini")).toBe(true);
      expect(isResponsesApiSupportedModel("gpt-4o")).toBe(true);
      expect(isResponsesApiSupportedModel("o3-mini")).toBe(true);
    });
  });

  describe("filterResponsesApiSupportedModels", () => {
    it("filters out unsupported models from a list", () => {
      const models: OpenAIModel[] = [
        {
          id: "gpt-4.1-mini",
          object: "model",
          created: 1,
          owned_by: "openai",
        },
        {
          id: "gpt-4o-mini-transcribe-2025-12-15",
          object: "model",
          created: 2,
          owned_by: "openai",
        },
        {
          id: "whisper-1",
          object: "model",
          created: 3,
          owned_by: "openai",
        },
      ];

      expect(filterResponsesApiSupportedModels(models)).toEqual([
        {
          id: "gpt-4.1-mini",
          object: "model",
          created: 1,
          owned_by: "openai",
        },
      ]);
    });
  });
});
