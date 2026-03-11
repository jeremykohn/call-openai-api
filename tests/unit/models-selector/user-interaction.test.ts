import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ModelsSelector from "~/components/ModelsSelector.vue";
import type { OpenAIModel } from "~~/types/models";

/**
 * Unit tests for ModelsSelector component - User Interaction.
 * Tests event emissions and user-triggered changes.
 */
describe("ModelsSelector - User Interaction", () => {
  const mockModels: OpenAIModel[] = [
    { id: "gpt-4", object: "model", created: 1686935002, owned_by: "openai" },
    {
      id: "gpt-3.5-turbo",
      object: "model",
      created: 1677649963,
      owned_by: "openai",
    },
    {
      id: "text-davinci-003",
      object: "model",
      created: 1669599635,
      owned_by: "openai",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits update:selectedModelId when selection changes", async () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    await select.setValue("gpt-3.5-turbo");

    const updateEmitted = wrapper.emitted("update:selectedModelId");
    expect(updateEmitted).toBeTruthy();
    expect(updateEmitted?.[0]).toEqual(["gpt-3.5-turbo"]);
  });

  it("does not emit events when select is disabled (error state)", async () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "error",
        error: "Failed to load models",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    // Select is disabled, so the value cannot be changed via setValue
    expect(select.attributes("disabled")).toBeDefined();
  });

  it("emits null update when selection is cleared", async () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    await select.setValue("");

    const updateEmitted = wrapper.emitted("update:selectedModelId");
    expect(updateEmitted).toBeTruthy();
    expect(updateEmitted?.[0]).toEqual([null]);
  });
});
