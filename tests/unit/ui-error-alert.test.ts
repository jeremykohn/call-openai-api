import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import UiErrorAlert from "../../app/components/UiErrorAlert.vue";

describe("UiErrorAlert", () => {
  it("renders role alert with title, message, and details", () => {
    const wrapper = mount(UiErrorAlert, {
      props: {
        title: "Something went wrong",
        message: "Request to OpenAI failed.",
        details: "status: 401",
      },
    });

    const alert = wrapper.get("[role='alert']");
    expect(alert.text()).toContain("Something went wrong");
    expect(alert.text()).toContain("Request to OpenAI failed.");
    expect(alert.text()).toContain("status: 401");
  });

  it("does not render details when not provided", () => {
    const wrapper = mount(UiErrorAlert, {
      props: {
        message: "An unexpected error occurred.",
      },
    });

    expect(wrapper.text()).toContain("An unexpected error occurred.");
    expect(wrapper.text()).not.toContain("Details:");
  });

  it("renders retry button when enabled and emits retry", async () => {
    const wrapper = mount(UiErrorAlert, {
      props: {
        message: "Failed to fetch models",
        showRetry: true,
        retryLabel: "Try again",
        retryButtonTestId: "retry-button",
      },
    });

    const retryButton = wrapper.get("[data-testid='retry-button']");
    expect(retryButton.text()).toBe("Try again");

    await retryButton.trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("uses safe defaults for retry label and test id", () => {
    const wrapper = mount(UiErrorAlert, {
      props: {
        message: "Failed to fetch models",
        showRetry: true,
      },
    });

    const retryButton = wrapper.get("[data-testid='retry-button']");
    expect(retryButton.text()).toBe("Try again");
  });
});
