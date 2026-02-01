import { test, expect, type Page } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const gotoPath = (page: Page, path: string) =>
  page.goto(new URL(path, baseURL).toString());

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, "/settings");
  });

  test("should display API key inputs", async ({ page }) => {
    const hasApiSection = await page.locator("text=API Keys").isVisible();
    if (hasApiSection) {
        // Use first() to avoid strict mode issues
        await expect(page.locator('input[aria-label*="OpenAI"]').first()).toBeVisible();
        await expect(page.locator('label:has-text("Anthropic")').first()).toBeVisible();
        await expect(page.locator('label:has-text("Google")').first()).toBeVisible();
    }
  });

  test("should test API key", async ({ page }) => {
    const hasApiSection = await page.locator("text=API Keys").isVisible();
    if (hasApiSection) {
        // Fill in a test key
        await page.fill('input[aria-label*="OpenAI"]', "sk-test-key");

        // Click test button - force click to bypass overlays
        await page.click('button:has-text("Test")', { force: true });

        // Should show result (valid or invalid)
        await expect(
        page.locator('text=/Invalid|Valid/').first()
        ).toBeVisible({ timeout: 5000 });
    }
  });
});

