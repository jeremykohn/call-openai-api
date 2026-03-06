import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ModelsSelector from "../../../app/components/ModelsSelector.vue";
import type { OpenAIModel } from "../../../types/models";

/**
 * Unit tests for ModelsSelector component - Loading State.
 * Tests loading indicator visibility and behavior.
 */
describe("ModelsSelector - Loading State", () => {
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

  it("displays loading indicator when status is loading", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: [],
        selectedModelId: null,
        status: "loading",
      },
    });

    const loadingElement = wrapper.find("[data-testid='loading-indicator']");
    expect(loadingElement.exists()).toBe(true);
  });

  it("hides loading indicator when status is not loading", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const loadingElement = wrapper.find("[data-testid='loading-indicator']");
    expect(loadingElement.exists()).toBe(false);
  });
});
