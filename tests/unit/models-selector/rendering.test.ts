import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ModelsSelector from "~/components/ModelsSelector.vue";
import type { OpenAIModel } from "~~/types/models";

/**
 * Unit tests for ModelsSelector component - Rendering.
 * Tests DOM structure, element presence, and proper rendering of models.
 */
describe("ModelsSelector - Rendering", () => {
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

  it("renders a select element with correct id and label", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    expect(select.exists()).toBe(true);
    expect(select.element).toBeInstanceOf(HTMLSelectElement);

    const label = wrapper.find("[for='models-select']");
    expect(label.exists()).toBe(true);
    expect(label.text()).toContain("Model");
  });

  it("renders all models as option elements", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-4",
        status: "success",
      },
    });

    const options = wrapper.findAll("option");
    // +1 for empty/placeholder option
    expect(options).toHaveLength(mockModels.length + 1);

    mockModels.forEach((model, index) => {
      const option = options.at(index + 1);
      expect(option).toBeDefined();
      expect(option?.attributes("value")).toBe(model.id);
      expect(option?.text()).toContain(model.id);
    });
  });

  it("marks the selected model as selected", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: "gpt-3.5-turbo",
        status: "success",
      },
    });

    const select = wrapper.find("[data-testid='models-select']");
    const selectElement = select.element as HTMLSelectElement;
    expect(selectElement.value).toBe("gpt-3.5-turbo");
  });

  it("displays placeholder text when no model is selected", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: null,
        status: "success",
      },
    });

    const options = wrapper.findAll("option");
    const placeholderOption = options.at(0);
    expect(placeholderOption).toBeDefined();
    expect(placeholderOption?.attributes("value")).toBe("");
    expect(placeholderOption?.text()).toContain("Select a model");
  });

  it("does not render unverified availability caveat text", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: [
          {
            id: "gpt-image-1.5",
            object: "model",
            created: 1686935002,
            owned_by: "openai",
          },
        ],
        selectedModelId: null,
        status: "success",
      },
    });

    expect(wrapper.text()).not.toContain("Availability unverified");
    expect(wrapper.text()).not.toContain("unverified availability");
  });

  it("shows fallback note with exact text when fallback mode is active", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: null,
        status: "success",
        showFallbackNote: true,
      },
    });

    const fallbackNote = wrapper.find("[data-testid='models-fallback-note']");
    expect(fallbackNote.exists()).toBe(true);
    expect(fallbackNote.text()).toBe(
      "Note: List of OpenAI models may include some older models that are no longer available.",
    );
  });

  it("hides fallback note when fallback mode is inactive", () => {
    const wrapper = mount(ModelsSelector, {
      props: {
        models: mockModels,
        selectedModelId: null,
        status: "success",
        showFallbackNote: false,
      },
    });

    expect(wrapper.find("[data-testid='models-fallback-note']").exists()).toBe(
      false,
    );
  });
});
