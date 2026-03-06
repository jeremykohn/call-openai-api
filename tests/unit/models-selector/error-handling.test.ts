import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ModelsSelector from "../../../app/components/ModelsSelector.vue";
import type { OpenAIModel } from "../../../types/models";

/**
 * Unit tests for ModelsSelector component - Error Handling.
 * Tests error message display and error state visibility.
 */
describe("ModelsSelector - Error Handling", () => {
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

  it("displays error message when status is error", () => {
    const errorMessage = "Failed to fetch models from OpenAI API";
    const wrapper = mount(ModelsSelector, {
      props: {
        models: [],
        selectedModelId: null,
        status: "error",
        error: errorMessage,
        errorDetails: "401 Unauthorized",
      },
    });

    const errorElement = wrapper.find("[role='alert']");
    expect(errorElement.exists()).toBe(true);
    expect(errorElement.text()).toContain(errorMessage);
  });

  it("displays error details when available", () => {
    const errorDetails = "Invalid API key provided";
    const wrapper = mount(ModelsSelector, {
      props: {
        models: [],
        selectedModelId: null,
        status: "error",
        error: "API Error",
        errorDetails: errorDetails,
      },
    });

    const errorElement = wrapper.find("[role='alert']");
    expect(errorElement.text()).toContain(errorDetails);
  });

  it("does not display error element when status is not error", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const errorElement = wrapper.find("[role='alert']");
    expect(errorElement.exists()).toBe(false);
  });
});
