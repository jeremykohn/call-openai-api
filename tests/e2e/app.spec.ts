import { expect, test } from "@playwright/test";

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
      body: JSON.stringify({ response: "Hello from the API" }),
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

  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await expect(page.getByText("Request to OpenAI failed.")).toBeVisible();
  await expect(page.getByText("Server unavailable")).toBeVisible();
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
      body: JSON.stringify({ response: "Should not be called" }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByRole("alert")).toContainText("Please enter a prompt.");
  await expect(page.getByLabel("Prompt")).toBeFocused();

  await page.waitForTimeout(200);
  expect(respondCalled).toBe(false);
});
