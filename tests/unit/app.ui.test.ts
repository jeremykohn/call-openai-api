import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const buildWrapper = async (state: { status: string; data: string | null; error: string | null }) => {
  vi.resetModules();
  vi.doMock("../../app/composables/use-request-state", () => ({
    useRequestState: () => ({
      state: ref(state),
      start: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      reset: vi.fn()
    })
  }));

  vi.doMock("../../app/utils/prompt-validation", () => ({
    validatePrompt: () => ({ ok: true, prompt: "Hello" })
  }));

  const { default: App } = await import("../../app/app.vue");
  return mount(App);
};

describe("App UI states", () => {
  beforeEach(() => {
    vi.stubGlobal("$fetch", vi.fn());
  });

  it("renders the loading state", async () => {
    const wrapper = await buildWrapper({ status: "loading", data: null, error: null });

    expect(wrapper.text()).toContain("Waiting for response from ChatGPT...");
  });

  it("renders the success state", async () => {
    const wrapper = await buildWrapper({ status: "success", data: "Hello", error: null });

    expect(wrapper.text()).toContain("Response");
    expect(wrapper.text()).toContain("Hello");
  });

  it("renders the error state", async () => {
    const wrapper = await buildWrapper({ status: "error", data: null, error: "Oops" });

    expect(wrapper.text()).toContain("Something went wrong");
    expect(wrapper.text()).toContain("Oops");
  });
});
