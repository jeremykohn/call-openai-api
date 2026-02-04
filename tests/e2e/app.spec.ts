import { expect, test } from "@playwright/test";

test("submits a prompt and renders the response", async ({ page }) => {
  await page.route("**/api/respond", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ response: "Hello from the API" })
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Prompt").fill("Hello");
  const requestPromise = page.waitForRequest("**/api/respond");
  await page.getByRole("button", { name: "Send" }).click();
  await requestPromise;

  await expect(page.getByText("Waiting for response from ChatGPT...")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Response" })).toBeVisible();
  await expect(page.getByText("Hello from the API")).toBeVisible();
});

test("shows an error message when the API fails", async ({ page }) => {
  await page.route("**/api/respond", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Request to OpenAI failed.",
        details: "Server unavailable"
      })
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Prompt").fill("Hello");
  const requestPromise = page.waitForRequest("**/api/respond");
  await page.getByRole("button", { name: "Send" }).click();
  await requestPromise;

  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  await expect(page.getByText("Request to OpenAI failed. Server unavailable")).toBeVisible();
});
