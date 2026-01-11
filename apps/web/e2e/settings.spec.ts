import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("should display API key inputs", async ({ page }) => {
    await expect(page.locator('input[aria-label*="OpenAI"]')).toBeVisible();
    await expect(page.locator('label:has-text("Anthropic")')).toBeVisible();
    await expect(page.locator('label:has-text("Google")')).toBeVisible();
  });

  test("should test API key", async ({ page }) => {
    // Fill in a test key
    await page.fill('input[aria-label*="OpenAI"]', "sk-test-key");

    // Click test button
    await page.click('button:has-text("Test")');

    // Should show result (valid or invalid)
    await expect(
      page.locator('text=/Invalid|Valid/')
    ).toBeVisible({ timeout: 5000 });
  });
});

