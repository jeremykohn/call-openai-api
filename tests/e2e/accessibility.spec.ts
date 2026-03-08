import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const mockModels = [
  { id: "gpt-4", created: 1686935002, owned_by: "openai" },
  { id: "gpt-3.5-turbo", created: 1677649963, owned_by: "openai" },
];

test.describe("Accessibility (axe) - e2e", () => {
  test("home page has no detectable axe violations", async ({ page }) => {
    await page.route("**/api/models", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockModels }),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("error UI has no detectable axe violations", async ({ page }) => {
    await page.route("**/api/models", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockModels }),
      });
    });

    await page.route("**/api/respond", async (route) => {
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

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
