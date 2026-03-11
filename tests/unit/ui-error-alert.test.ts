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

  it("renders the alert with a stable container id when provided", () => {
    const wrapper = mount(UiErrorAlert, {
      props: {
        containerId: "prompt-error",
        message: "Prompt is required.",
      },
    });

    const alert = wrapper.get("#prompt-error[role='alert']");
    expect(alert.text()).toContain("Prompt is required.");
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

  it("keeps details collapsed by default when details toggle is enabled", () => {
    const wrapper = mount(UiErrorAlert, {
      props: {
        message: "Request to OpenAI failed.",
        details: "status: 401",
        enableDetailsToggle: true,
      },
    });

    expect(wrapper.text()).toContain("Show details");
    expect(wrapper.text()).not.toContain("status: 401");
  });

  it("shows and hides details deterministically when toggle is clicked", async () => {
    const wrapper = mount(UiErrorAlert, {
      props: {
        message: "Request to OpenAI failed.",
        details: "status: 401",
        enableDetailsToggle: true,
      },
    });

    const detailsToggle = wrapper.get("[data-testid='details-toggle']");

    expect(detailsToggle.attributes("type")).toBe("button");
    expect(detailsToggle.attributes("aria-expanded")).toBe("false");
    expect(detailsToggle.text()).toBe("Show details");

    await detailsToggle.trigger("click");
    expect(detailsToggle.text()).toBe("Hide details");
    expect(wrapper.text()).toContain("status: 401");
    expect(detailsToggle.attributes("aria-expanded")).toBe("true");

    await detailsToggle.trigger("click");
    expect(detailsToggle.text()).toBe("Show details");
    expect(wrapper.text()).not.toContain("status: 401");
    expect(detailsToggle.attributes("aria-expanded")).toBe("false");
  });

  it("renders retry as an accessible button", async () => {
    const wrapper = mount(UiErrorAlert, {
      attachTo: document.body,
      props: {
        message: "Failed to fetch models",
        showRetry: true,
      },
    });

    try {
      const retryButton = wrapper.get("[data-testid='retry-button']");
      expect(retryButton.attributes("type")).toBe("button");
      expect(retryButton.text()).toBe("Try again");

      const retryButtonElement = retryButton.element as HTMLButtonElement;
      retryButtonElement.focus();
      expect(document.activeElement).toBe(retryButtonElement);
    } finally {
      wrapper.unmount();
    }
  });
});
