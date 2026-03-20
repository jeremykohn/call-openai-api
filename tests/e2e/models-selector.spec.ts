import { expect, test } from "@playwright/test";
import { MODELS_FALLBACK_NOTE_TEXT } from "~~/shared/constants/models";

const mockModels = [
  { id: "gpt-4", created: 1686935002, owned_by: "openai" },
  { id: "gpt-3.5-turbo", created: 1677649963, owned_by: "openai" },
];

test("loads models and allows selection", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "list",
        data: mockModels,
        usedConfigFilter: false,
        showFallbackNote: false,
      }),
    });
  });

  await page.goto("/");

  const select = page.getByRole("combobox", { name: "Model" });
  await expect(select).toBeVisible();

  await select.selectOption("gpt-4");
  await expect(select).toHaveValue("gpt-4");
});

test("shows a loading indicator while models are fetching", async ({
  page,
}) => {
  let releaseResponse: (() => void) | undefined;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  await page.route("**/api/models", async (route) => {
    await responseGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "list",
        data: mockModels,
        usedConfigFilter: false,
        showFallbackNote: false,
      }),
    });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForRequest("**/api/models");

  const loadingIndicator = page.getByTestId("loading-indicator");
  await expect(loadingIndicator).toBeVisible();

  releaseResponse?.();

  const select = page.getByRole("combobox", { name: "Model" });
  await expect(select).toBeVisible();
});

test("shows an error message when models API fails", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Failed to load models.",
        details: "Server unavailable",
      }),
    });
  });

  await page.goto("/");

  const alert = page.getByRole("alert");
  const detailsToggle = page.getByTestId("models-error-details-toggle");
  const retryButton = page.getByTestId("retry-button");
  const select = page.getByRole("combobox", { name: "Model" });

  await expect(alert).toContainText("Failed to load models.");
  await expect(alert).not.toContainText("Server unavailable");
  await expect(detailsToggle).toHaveText("Show details");
  await expect(detailsToggle).toHaveAttribute("aria-expanded", "false");
  await expect(retryButton).toBeVisible();
  await expect(select).toBeDisabled();
  await expect(select).toHaveAttribute(
    "aria-describedby",
    /models-select-error/,
  );

  await detailsToggle.focus();
  await page.keyboard.press("Enter");

  await expect(detailsToggle).toHaveText("Hide details");
  await expect(detailsToggle).toHaveAttribute("aria-expanded", "true");
  await expect(alert).toContainText("Server unavailable");

  await retryButton.focus();
  await expect(retryButton).toBeFocused();
});

test("disables selector and shows empty-state text when no models", async ({
  page,
}) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "list",
        data: [],
        usedConfigFilter: false,
        showFallbackNote: false,
      }),
    });
  });

  await page.goto("/");

  const select = page.getByRole("combobox", { name: "Model" });
  await expect(select).toBeDisabled();

  const firstOption = select.locator("option").first();
  await expect(firstOption).toHaveText("No models available");
});

test("does not show unknown-model caveat text", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "list",
        data: [
          ...mockModels,
          { id: "gpt-image-1.5", created: 1677649963, owned_by: "openai" },
        ],
        usedConfigFilter: false,
        showFallbackNote: false,
      }),
    });
  });

  await page.goto("/");

  const select = page.getByRole("combobox", { name: "Model" });
  await expect(select).toBeVisible();

  const unknownOption = select.locator("option[value='gpt-image-1.5']");
  await expect(unknownOption).toHaveText("gpt-image-1.5");
  await expect(page.getByText(/unverified availability/i)).toHaveCount(0);
});

test("valid config scenario hides fallback note and shows filtered alphabetical list", async ({
  page,
}) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "list",
        data: [
          { id: "gpt-4.1", created: 1686935002, owned_by: "openai" },
          { id: "gpt-4.1-mini", created: 1686935003, owned_by: "openai" },
        ],
        usedConfigFilter: true,
        showFallbackNote: false,
      }),
    });
  });

  await page.goto("/");

  const select = page.getByRole("combobox", { name: "Model" });
  await expect(select).toBeVisible();

  const options = select.locator("option");
  await expect(options.nth(1)).toHaveText("gpt-4.1");
  await expect(options.nth(2)).toHaveText("gpt-4.1-mini");
  await expect(select.locator("option[value='babbage-002']")).toHaveCount(0);
  await expect(
    select.locator("option[value='gpt-3.5-turbo-instruct']"),
  ).toHaveCount(0);

  await expect(page.getByTestId("models-fallback-note")).toHaveCount(0);
  await expect(page.getByText(MODELS_FALLBACK_NOTE_TEXT)).toHaveCount(0);
});

test("fallback scenario shows full alphabetical list and exact fallback note", async ({
  page,
}) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "list",
        data: [
          { id: "babbage-002", created: 1686935002, owned_by: "openai" },
          { id: "gpt-4.1", created: 1686935003, owned_by: "openai" },
          {
            id: "gpt-3.5-turbo-instruct",
            created: 1686935004,
            owned_by: "openai",
          },
        ],
        usedConfigFilter: false,
        showFallbackNote: true,
      }),
    });
  });

  await page.goto("/");

  const select = page.getByRole("combobox", { name: "Model" });
  await expect(select).toBeVisible();

  const options = select.locator("option");
  await expect(options.nth(1)).toHaveText("babbage-002");
  await expect(options.nth(2)).toHaveText("gpt-4.1");
  await expect(options.nth(3)).toHaveText("gpt-3.5-turbo-instruct");

  await expect(page.getByTestId("models-fallback-note")).toHaveText(
    MODELS_FALLBACK_NOTE_TEXT,
  );
});
