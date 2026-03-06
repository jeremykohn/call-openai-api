import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ModelsSelector from "../../../app/components/ModelsSelector.vue";
import type { OpenAIModel } from "../../../types/models";

/**
 * Unit tests for ModelsSelector component - Edge Cases.
 * Tests boundary conditions and uncommon scenarios.
 */
describe("ModelsSelector - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles empty models list gracefully", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: [],
        selectedModelId: null,
        status: "success",
      },
    });

    const options = wrapper.findAll("option");
    // Only placeholder option
    expect(options).toHaveLength(1);
    const noModelsOption = options.at(0);
    expect(noModelsOption).toBeDefined();
    expect(noModelsOption?.text()).toContain("No models available");
  });

  it("handles very long model names gracefully", () => {
    const longNameModel: OpenAIModel = {
      id: "this-is-an-extremely-long-model-name-that-might-break-the-ui-if-not-handled-properly",
      object: "model",
      created: 1686935002,
      owned_by: "openai",
    };

    const wrapper = mount(ModelsSelector, {
      props: {
        models: [longNameModel],
        selectedModelId: longNameModel.id,
        status: "success",
      },
    });

    const option = wrapper.findAll("option").at(1);
    expect(option).toBeDefined();
    expect(option?.text()).toContain(longNameModel.id);
  });

  it("handles models with special characters in id", () => {
    const specialCharModel: OpenAIModel = {
      id: "model-v1.0_beta+release",
      object: "model",
      created: 1686935002,
      owned_by: "openai",
    };

    const wrapper = mount(ModelsSelector, {
      props: {
        models: [specialCharModel],
        selectedModelId: specialCharModel.id,
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    const selectElement = select.element as HTMLSelectElement;
    expect(selectElement.value).toBe("model-v1.0_beta+release");
  });
});
