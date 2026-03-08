import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { axe, configureAxe } from "vitest-axe";

const componentAxe = configureAxe({
  rules: {
    region: {
      enabled: false,
    },
  },
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("Accessibility (axe) - unit", () => {
  it("has no detectable axe violations for ModelsSelector in success state", async () => {
    const { default: ModelsSelector } = await import(
      "../../app/components/ModelsSelector.vue"
    );

    const wrapper = mount(ModelsSelector, {
      props: {
        models: [
          {
            id: "gpt-4",
            object: "model",
            created: 1686935002,
            owned_by: "openai",
          },
        ],
        selectedModelId: "gpt-4",
        status: "success",
        required: true,
      },
    });

    const results = await componentAxe(wrapper.element);
    expect(results.violations).toEqual([]);
  });

  it("has no detectable axe violations for App initial view", async () => {
    vi.stubGlobal("$fetch", vi.fn());

    vi.doMock("../../app/composables/use-request-state", () => ({
      useRequestState: () => ({
        state: ref({
          status: "idle",
          data: null,
          error: null,
          errorDetails: null,
        }),
        start: vi.fn(),
        succeed: vi.fn(),
        fail: vi.fn(),
        reset: vi.fn(),
      }),
    }));

    vi.doMock("../../app/composables/use-models-state", () => ({
      useModelsState: () => ({
        state: ref({
          status: "success",
          data: [
            {
              id: "gpt-4",
              object: "model",
              created: 1686935002,
              owned_by: "openai",
            },
          ],
          error: null,
          errorDetails: null,
        }),
      }),
    }));

    vi.doMock("../../app/utils/prompt-validation", () => ({
      validatePrompt: (prompt: string) => ({ ok: true, prompt }),
    }));

    const { default: App } = await import("../../app/app.vue");
    const wrapper = mount(App);

    const results = await axe(wrapper.element);
    expect(results.violations).toEqual([]);
  });
});
