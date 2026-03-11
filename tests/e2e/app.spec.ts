import { expect, test } from "@playwright/test";
import { DEFAULT_MODEL } from "../../shared/constants/models";

const NETWORK_ERROR_MESSAGE =
  "Network error: Unable to reach OpenAI. Please check your internet connection and try again.";

const UNKNOWN_ERROR_MESSAGE =
  "An unexpected error occurred. Please try again or contact support.";

const mockModels = [
  { id: "gpt-4", created: 1686935002, owned_by: "openai" },
  { id: "gpt-3.5-turbo", created: 1677649963, owned_by: "openai" },
];

test("submits a prompt and renders the response", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels }),
    });
  });

  await page.route("**/api/respond", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: "Hello from the API",
        model: DEFAULT_MODEL,
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Prompt").fill("Hello");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(
    page.getByText("Waiting for response from ChatGPT..."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Response" })).toBeVisible();
  await expect(page.getByText("Hello from the API")).toBeVisible();
});

test("shows an error message when the API fails", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels }),
    });
  });

  await page.route("**/api/respond", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Request to OpenAI failed.",
        details: "Server unavailable",
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Prompt").fill("Hello");
  await page.getByRole("button", { name: "Send" }).click();

  const alert = page.getByRole("alert");
  const detailsToggle = page.getByTestId("response-error-details-toggle");

  await expect(alert).toContainText("Something went wrong");
  await expect(alert).toContainText("Request to OpenAI failed.");
  await expect(alert).not.toContainText("Server unavailable");
  await expect(detailsToggle).toHaveText("Show details");
  await expect(detailsToggle).toHaveAttribute("aria-expanded", "false");

  await detailsToggle.focus();
  await page.keyboard.press("Enter");

  await expect(detailsToggle).toHaveText("Hide details");
  await expect(detailsToggle).toHaveAttribute("aria-expanded", "true");
  await expect(alert).toContainText("Server unavailable");
});

test("shows a network error with actionable guidance when the request cannot be sent", async ({
  page,
}) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels }),
    });
  });

  await page.route("**/api/respond", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Prompt").fill("Hello");
  await page.getByRole("button", { name: "Send" }).click();

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Something went wrong");
  await expect(alert).toContainText(NETWORK_ERROR_MESSAGE);
});

test("shows the unknown fallback when submit throws a non-network error", async ({
  page,
}) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    const globalWindow = window as Window & {
      $fetch: (
        request: RequestInfo | URL,
        options?: RequestInit,
      ) => Promise<unknown>;
      __originalFetchForTest?: typeof globalWindow.$fetch;
    };
    globalWindow.__originalFetchForTest =
      globalWindow.$fetch.bind(globalWindow);

    globalWindow.$fetch = (request, options) => {
      const requestUrl =
        typeof request === "string"
          ? request
          : request instanceof URL
            ? request.toString()
            : request.url;

      if (requestUrl.includes("/api/respond")) {
        return Promise.reject(new Error("Unexpected client-side failure"));
      }

      return globalWindow.__originalFetchForTest!(request, options);
    };
  });

  try {
    await page.getByLabel("Prompt").fill("Hello");
    await page.getByRole("button", { name: "Send" }).click();

    const alert = page.getByRole("alert");
    const detailsToggle = page.getByTestId("response-error-details-toggle");

    await expect(alert).toContainText("Something went wrong");
    await expect(alert).toContainText(UNKNOWN_ERROR_MESSAGE);
    await expect(alert).not.toContainText("Unexpected client-side failure");
    await expect(detailsToggle).toHaveText("Show details");

    await detailsToggle.focus();
    await page.keyboard.press("Enter");

    await expect(detailsToggle).toHaveText("Hide details");
    await expect(alert).toContainText("Unexpected client-side failure");
  } finally {
    await page.evaluate(() => {
      const globalWindow = window as Window & {
        $fetch: (
          request: RequestInfo | URL,
          options?: RequestInit,
        ) => Promise<unknown>;
        __originalFetchForTest?: (
          request: RequestInfo | URL,
          options?: RequestInit,
        ) => Promise<unknown>;
      };

      if (globalWindow.__originalFetchForTest) {
        globalWindow.$fetch = globalWindow.__originalFetchForTest;
        delete globalWindow.__originalFetchForTest;
      }
    });
  }
});

test("shows validation error when prompt is empty", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels }),
    });
  });

  let respondCalled = false;
  await page.route("**/api/respond", async (route) => {
    respondCalled = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: "Should not be called",
        model: DEFAULT_MODEL,
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByRole("alert")).toContainText("Please enter a prompt.");
  await expect(page.getByLabel("Prompt")).toBeFocused();
  expect(respondCalled).toBe(false);
});

test("selecting a model and submitting generates response using that model", async ({
  page,
}) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels }),
    });
  });

  let capturedRequestBody: { prompt: string; model?: string } | null = null;
  await page.route("**/api/respond", async (route) => {
    const request = route.request();
    capturedRequestBody = JSON.parse(request.postData() || "{}");

    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: "Response using gpt-4",
        model: "gpt-4",
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Select a specific model
  await page.getByRole("combobox", { name: "Model" }).selectOption("gpt-4");

  await page.getByLabel("Prompt").fill("Test with selected model");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByRole("heading", { name: "Response" })).toBeVisible();
  await expect(page.getByText("Response using gpt-4")).toBeVisible();

  // Verify the request included the selected model
  expect(capturedRequestBody).toEqual({
    prompt: "Test with selected model",
    model: "gpt-4",
  });
});

test("submitting without selecting a model generates response using default", async ({
  page,
}) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels }),
    });
  });

  let capturedRequestBody: { prompt: string; model?: string } | null = null;
  await page.route("**/api/respond", async (route) => {
    const request = route.request();
    capturedRequestBody = JSON.parse(request.postData() || "{}");

    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: "Response using default model",
        model: DEFAULT_MODEL,
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Do NOT select a model - leave it as default placeholder
  await page.getByLabel("Prompt").fill("Test with default model");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByRole("heading", { name: "Response" })).toBeVisible();
  await expect(page.getByText("Response using default model")).toBeVisible();

  // Verify the request did NOT include a model field
  expect(capturedRequestBody).toEqual({
    prompt: "Test with default model",
  });
});
