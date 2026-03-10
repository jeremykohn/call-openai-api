import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ModelsSelector from "~/components/ModelsSelector.vue";
import type { OpenAIModel } from "~~/types/models";

/**
 * Unit tests for ModelsSelector component - State Management.
 * Tests component state, disabled states, and loading/error visibility.
 */
describe("ModelsSelector - State Management", () => {
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

  it("hides select and shows loading indicator when status is loading", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "loading",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    const loadingIndicator = wrapper.find(
      "[data-testid='loading-indicator']",
    );

    expect(select.exists()).toBe(false);
    expect(loadingIndicator.exists()).toBe(true);
  });

  it("disables select when status is error", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "error",
        error: "Failed to load models",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    expect(select.attributes("disabled")).toBeDefined();
  });

  it("disables select when no models are available", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: [],
        selectedModelId: null,
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    expect(select.attributes("disabled")).toBeDefined();
  });

  it("enables select when status is success", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    expect(select.attributes("disabled")).not.toBeDefined();
  });
});
