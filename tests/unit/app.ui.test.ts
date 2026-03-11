import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import {
  NETWORK_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from "../../app/utils/error-normalization";
import { DEFAULT_MODEL } from "~~/shared/constants/models";
const buildWrapper = async (state: {
  status: string;
  data: string | null;
  error: string | null;
  errorDetails: string | null;
}) => {
  vi.resetModules();
  vi.doMock("../../app/composables/use-request-state", () => ({
    useRequestState: () => ({
      state: ref(state),
      start: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      reset: vi.fn(),
    }),
  }));

  vi.doMock("../../app/utils/prompt-validation", () => ({
    validatePrompt: () => ({ ok: true, prompt: "Hello" }),
  }));

  const { default: App } = await import("../../app/app.vue");
  return mount(App);
};

describe("App UI states", () => {
  beforeEach(() => {
    vi.stubGlobal("$fetch", vi.fn());
  });

  it("applies Tailwind layout classes to the app container", async () => {
    const wrapper = await buildWrapper({
      status: "idle",
      data: null,
      error: null,
      errorDetails: null,
    });

    const container = wrapper.find(".page");
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain("min-h-screen");
  });

  it("renders the loading state", async () => {
    const wrapper = await buildWrapper({
      status: "loading",
      data: null,
      error: null,
      errorDetails: null,
    });

    expect(wrapper.text()).toContain("Waiting for response from ChatGPT...");

    const submitButton = wrapper.get("button[type='submit']");
    expect(submitButton.attributes("disabled")).toBeDefined();
    expect(submitButton.attributes("aria-busy")).toBe("true");
  });

  it("shows the prompt length hint", async () => {
    const wrapper = await buildWrapper({
      status: "idle",
      data: null,
      error: null,
      errorDetails: null,
    });

    expect(wrapper.text()).toContain("Maximum 4000 characters.");
  });

  it("renders the success state", async () => {
    const wrapper = await buildWrapper({
      status: "success",
      data: "Hello",
      error: null,
      errorDetails: null,
    });

    expect(wrapper.text()).toContain("Response");
    expect(wrapper.text()).toContain("Hello");
  });

  it("renders the error state", async () => {
    const wrapper = await buildWrapper({
      status: "error",
      data: null,
      error: "Oops",
      errorDetails: "Details here",
    });

    expect(wrapper.text()).toContain("Something went wrong");
    expect(wrapper.text()).toContain("Oops");
    expect(wrapper.text()).toContain("Details here");
  });

  it("includes focus-visible styles on primary actions", async () => {
    const wrapper = await buildWrapper({
      status: "idle",
      data: null,
      error: null,
      errorDetails: null,
    });

    const button = wrapper.get("button[type='submit']");
    expect(button.classes()).toContain("focus-visible:outline");

    const termsLink = wrapper.get(
      "a[href='https://openai.com/policies/terms-of-use/']",
    );
    expect(termsLink.classes()).toContain("focus-visible:outline");
  });
});

describe("App submit payload with model selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const buildSubmitWrapper = async (
    mockFetch: ReturnType<typeof vi.fn>,
    requestStatus: "idle" | "loading" | "success" | "error" = "idle",
    failMock: ReturnType<typeof vi.fn> = vi.fn(),
  ) => {
    vi.resetModules();
    vi.stubGlobal("$fetch", mockFetch);

    vi.doMock("../../app/composables/use-request-state", () => ({
      useRequestState: () => ({
        state: ref({
          status: requestStatus,
          data: null,
          error: null,
          errorDetails: null,
        }),
        start: vi.fn(),
        succeed: vi.fn(),
        fail: failMock,
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
            {
              id: "gpt-3.5-turbo",
              object: "model",
              created: 1677649963,
              owned_by: "openai",
            },
          ],
          error: null,
          errorDetails: null,
        }),
        fetchModels: vi.fn(),
      }),
    }));

    vi.doMock("../../app/utils/prompt-validation", () => ({
      validatePrompt: () => ({ ok: true, prompt: "Hello" }),
    }));

    const { default: App } = await import("../../app/app.vue");
    return { wrapper: mount(App), failMock };
  };

  it("includes selected model in request when model is selected", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      response: "Test response",
      model: "gpt-4",
    });
    const { wrapper } = await buildSubmitWrapper(mockFetch);

    await wrapper.get("#prompt-input").setValue("Hello");
    await wrapper.get("[data-testid='models-select']").setValue("gpt-4");
    await wrapper.get("form").trigger("submit");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/respond",
      expect.objectContaining({
        method: "POST",
        body: {
          prompt: "Hello",
          model: "gpt-4",
        },
      }),
    );
  });

  it("omits model from request when no model is selected", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      response: "Test response",
      model: DEFAULT_MODEL, // Server will use default
    });
    const { wrapper } = await buildSubmitWrapper(mockFetch);

    await wrapper.get("#prompt-input").setValue("Hello");
    await wrapper.get("form").trigger("submit");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/respond",
      expect.objectContaining({
        method: "POST",
        body: {
          prompt: "Hello",
        },
      }),
    );
  });

  it("does not submit while request is already loading", async () => {
    const mockFetch = vi.fn();
    const { wrapper } = await buildSubmitWrapper(mockFetch, "loading");

    await wrapper.get("#prompt-input").setValue("Hello");
    await wrapper.get("form").trigger("submit");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uses canonical network message when submit fails with network error", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const failMock = vi.fn();
    const { wrapper } = await buildSubmitWrapper(mockFetch, "idle", failMock);

    await wrapper.get("#prompt-input").setValue("Hello");
    await wrapper.get("form").trigger("submit");

    expect(failMock).toHaveBeenCalledWith(NETWORK_ERROR_MESSAGE, undefined);
  });

  it("uses API message and details when submit fails with API error", async () => {
    const mockFetch = vi.fn().mockRejectedValue({
      data: {
        message: "Invalid API key. Please check your key and try again.",
        details: "status: 401",
      },
    });
    const failMock = vi.fn();
    const { wrapper } = await buildSubmitWrapper(mockFetch, "idle", failMock);

    await wrapper.get("#prompt-input").setValue("Hello");
    await wrapper.get("form").trigger("submit");

    expect(failMock).toHaveBeenCalledWith(
      "Invalid API key. Please check your key and try again.",
      "status: 401",
    );
  });

  it("uses canonical unknown message with details when submit fails unexpectedly", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("unexpected runtime issue"));
    const failMock = vi.fn();
    const { wrapper } = await buildSubmitWrapper(mockFetch, "idle", failMock);

    await wrapper.get("#prompt-input").setValue("Hello");
    await wrapper.get("form").trigger("submit");

    expect(failMock).toHaveBeenCalledWith(
      UNKNOWN_ERROR_MESSAGE,
      "unexpected runtime issue",
    );
  });
});
