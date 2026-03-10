import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ModelsSelector from "~/components/ModelsSelector.vue";
import type { OpenAIModel } from "~~/types/models";
import { DEFAULT_MODEL } from "../../../shared/constants/models";

/**
 * Unit tests for ModelsSelector component - Accessibility.
 * Tests WCAG 2.2 compliance including ARIA attributes, labels, and keyboard support.
 */
describe("ModelsSelector - Accessibility", () => {
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

  it("uses visible label association for the select element", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    expect(select.attributes("aria-label")).toBeUndefined();
  });

  it("associates label with select using for/id", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const label = wrapper.find("label");
    const select = wrapper.find("[data-testid='models-select']");

    expect(label.attributes("for")).toBe(select.attributes("id"));
  });

  it("announces error state with role alert", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: [],
        selectedModelId: null,
        status: "error",
        error: "Failed to load models",
      },
    });

    const alert = wrapper.find("[role='alert']");
    expect(alert.exists()).toBe(true);
  });

  it("hides select and shows loading message when loading", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: [],
        selectedModelId: null,
        status: "loading",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    const loadingIndicator = wrapper.find(
      "[data-testid='loading-indicator']",
    );

    expect(select.exists()).toBe(false);
    expect(loadingIndicator.exists()).toBe(true);
    expect(loadingIndicator.text()).toContain("Loading models");
  });

  it("has aria-required when required", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
        required: true,
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    expect(select.attributes("aria-required")).toBe("true");
  });

  it("shows help text with default model and links it via aria-describedby", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: null,
        status: "success",
      },
    });

    const help = wrapper.find("#models-select-help");
    const select = wrapper.find("[data-testid='models-select']");

    expect(help.exists()).toBe(true);
    expect(help.text()).toContain(DEFAULT_MODEL);
    expect(select.attributes("aria-describedby")).toContain(
      "models-select-help",
    );
  });

  it("does not mark empty selection as an error in success state", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: null,
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    expect(select.attributes("aria-invalid")).toBe("false");
    expect(wrapper.find("#models-select-error").exists()).toBe(false);
  });
});
