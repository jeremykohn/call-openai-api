import { expect, test } from "@playwright/test";

const mockModels = [
  { id: "gpt-4", created: 1686935002, owned_by: "openai" },
  { id: "gpt-3.5-turbo", created: 1677649963, owned_by: "openai" }
];

test("loads models and allows selection", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels })
    });
  });

  await page.goto("/");

  const select = page.getByRole("combobox", { name: "Model" });
  await expect(select).toBeVisible();

  await select.selectOption("gpt-4");
  await expect(select).toHaveValue("gpt-4");
});

test("shows a loading indicator while models are fetching", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockModels })
    });
  });

  await page.goto("/");

  const loadingIndicator = page.getByTestId("loading-indicator");
  await expect(loadingIndicator).toBeVisible();

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
        details: "Server unavailable"
      })
    });
  });

  await page.goto("/");

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Failed to load models.");
  await expect(alert).toContainText("Server unavailable");
});

test("disables selector and shows empty-state text when no models", async ({ page }) => {
  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] })
    });
  });

  await page.goto("/");

  const select = page.getByRole("combobox", { name: "Model" });
  await expect(select).toBeDisabled();

  const firstOption = select.locator("option").first();
  await expect(firstOption).toHaveText("No models available");
});
