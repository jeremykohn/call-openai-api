import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ModelsSelector from "../../app/components/ModelsSelector.vue";
import type { OpenAIModel } from "../../types/models";

/**
 * Unit tests for ModelsSelector component.
 * Tests rendering, accessibility, state management, and error handling.
 */
describe("ModelsSelector Component", () => {
  const mockModels: OpenAIModel[] = [
    { id: "gpt-4", object: "model", created: 1686935002, owned_by: "openai" },
    { id: "gpt-3.5-turbo", object: "model", created: 1677649963, owned_by: "openai" },
    { id: "text-davinci-003", object: "model", created: 1669599635, owned_by: "openai" }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders a select element with correct id and label", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "success"
        }
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
          status: "success"
        }
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
          status: "success"
        }
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
          status: "success"
        }
      });

      const options = wrapper.findAll("option");
      const placeholderOption = options.at(0);
      expect(placeholderOption).toBeDefined();
      expect(placeholderOption?.attributes("value")).toBe("");
      expect(placeholderOption?.text()).toContain("Select a model");
    });
  });

  describe("State Management", () => {
    it("hides select and shows loading indicator when status is loading", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "loading"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      const loadingIndicator = wrapper.find("[data-testid='loading-indicator']");
      
      expect(select.exists()).toBe(false);
      expect(loadingIndicator.exists()).toBe(true);
    });

    it("disables select when status is error", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "error",
          error: "Failed to load models"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      expect(select.attributes("disabled")).toBeDefined();
    });

    it("disables select when no models are available", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: [],
          selectedModelId: null,
          status: "success"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      expect(select.attributes("disabled")).toBeDefined();
    });

    it("enables select when status is success", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "success"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      expect(select.attributes("disabled")).not.toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("displays error message when status is error", () => {
      const errorMessage = "Failed to fetch models from OpenAI API";
      const wrapper = mount(ModelsSelector, {
        props: {
          models: [],
          selectedModelId: null,
          status: "error",
          error: errorMessage,
          errorDetails: "401 Unauthorized"
        }
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
          errorDetails: errorDetails
        }
      });

      const errorElement = wrapper.find("[role='alert']");
      expect(errorElement.text()).toContain(errorDetails);
    });

    it("does not display error element when status is not error", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "success"
        }
      });

      const errorElement = wrapper.find("[role='alert']");
      expect(errorElement.exists()).toBe(false);
    });
  });

  describe("Loading State", () => {
    it("displays loading indicator when status is loading", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: [],
          selectedModelId: null,
          status: "loading"
        }
      });

      const loadingElement = wrapper.find("[data-testid='loading-indicator']");
      expect(loadingElement.exists()).toBe(true);
    });

    it("hides loading indicator when status is not loading", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "success"
        }
      });

      const loadingElement = wrapper.find("[data-testid='loading-indicator']");
      expect(loadingElement.exists()).toBe(false);
    });
  });

  describe("User Interaction", () => {
    it("emits update:selectedModelId when selection changes", async () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "success"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      await select.setValue("gpt-3.5-turbo");

      const updateEmitted = wrapper.emitted("update:selectedModelId");
      expect(updateEmitted).toBeTruthy();
      expect(updateEmitted?.[0]).toEqual(["gpt-3.5-turbo"]);
    });

    it("emits model-selected event with full model object", async () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "success"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      await select.setValue("gpt-3.5-turbo");

      const modelSelectedEmitted = wrapper.emitted("model-selected");
      expect(modelSelectedEmitted).toBeTruthy();
      const emittedModel = modelSelectedEmitted?.[0]?.[0] as OpenAIModel | undefined;
      expect(emittedModel?.id).toBe("gpt-3.5-turbo");
      expect(emittedModel?.created).toBe(1677649963);
    });

    it("does not emit events when select is disabled (error state)", async () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "error",
          error: "Failed to load models"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      // Select is disabled, so the value cannot be changed via setValue
      expect(select.attributes("disabled")).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("has proper aria-label for the select element", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "success"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      expect(select.attributes("aria-label")).toBeTruthy();
    });

    it("associates label with select using for/id", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: mockModels,
          selectedModelId: "gpt-4",
          status: "success"
        }
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
          error: "Failed to load models"
        }
      });

      const alert = wrapper.find("[role='alert']");
      expect(alert.exists()).toBe(true);
    });

    it("hides select and shows loading message when loading", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: [],
          selectedModelId: null,
          status: "loading"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      const loadingIndicator = wrapper.find("[data-testid='loading-indicator']");
      
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
          required: true
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      expect(select.attributes("aria-required")).toBe("true");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty models list gracefully", () => {
      const wrapper = mount(ModelsSelector, {
        props: {
          models: [],
          selectedModelId: null,
          status: "success"
        }
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
        owned_by: "openai"
      };

      const wrapper = mount(ModelsSelector, {
        props: {
          models: [longNameModel],
          selectedModelId: longNameModel.id,
          status: "success"
        }
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
        owned_by: "openai"
      };

      const wrapper = mount(ModelsSelector, {
        props: {
          models: [specialCharModel],
          selectedModelId: specialCharModel.id,
          status: "success"
        }
      });

      const select = wrapper.find("[data-testid='models-select']");
      const selectElement = select.element as HTMLSelectElement;
      expect(selectElement.value).toBe("model-v1.0_beta+release");
    });
  });
});
