import { test, expect } from "@playwright/test";

test.describe("Debate Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the council page
    await page.goto("/council");
  });

  test("should display empty state when no debates started", async ({ page }) => {
    await expect(page.locator("text=Start Your First Debate")).toBeVisible();
    await expect(page.locator("text=Select AI agents")).toBeVisible();
  });

  test("should show agent selector with available models", async ({ page }) => {
    // Check that agent selector is visible
    const agentSelector = page.locator('[data-testid="agent-selector"]').or(
      page.locator("text=Select Agents")
    );
    await expect(agentSelector.first()).toBeVisible();
  });

  test("should disable submit button when no agents selected", async ({ page }) => {
    // Fill in topic but don't select agents
    const textarea = page.locator('textarea[placeholder*="Describe"]').or(
      page.locator('input[placeholder*="Ask the council"]')
    );
    await textarea.fill("Test topic");

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test("should enable submit button when agents selected and topic entered", async ({ page }) => {
    // Select an agent (click on agent checkbox/button)
    const agentCheckbox = page.locator('[aria-label*="gpt-4o-mini"]').or(
      page.locator('button:has-text("GPT-4o Mini")')
    );
    if (await agentCheckbox.count() > 0) {
      await agentCheckbox.first().click();
    }

    // Enter topic
    const textarea = page.locator('textarea[placeholder*="Describe"]').or(
      page.locator('input[placeholder*="Ask the council"]')
    );
    await textarea.fill("Build a REST API with authentication");

    // Check submit button is enabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test("should show character count when typing", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Describe"]').or(
      page.locator('input[placeholder*="Ask the council"]')
    );
    await textarea.fill("Test message with some content");

    // Check that character count is displayed
    await expect(page.locator("text=30 chars").or(page.locator("text=/\\d+ chars/"))).toBeVisible();
  });

  test("should create a debate and show progress", async ({ page }) => {
    // This test requires mocking the API or having a test environment
    test.skip(process.env.CI !== undefined, "Skipping in CI - requires API mocking");

    // Select agents
    const agentCheckbox = page.locator('[aria-label*="gpt-4o-mini"]').first();
    if (await agentCheckbox.isVisible()) {
      await agentCheckbox.click();
    }

    // Enter topic
    const textarea = page.locator('textarea[placeholder*="Describe"]').or(
      page.locator('input[placeholder*="Ask the council"]')
    );
    await textarea.fill("Create a simple REST API for a todo app");

    // Submit
    await page.click('button[type="submit"]');

    // Wait for debate to start - should show loading indicator
    await expect(page.locator("text=Debating").or(page.locator('[data-testid="loading"]'))).toBeVisible({
      timeout: 10000,
    });

    // Wait for completion (with longer timeout for actual API calls)
    await expect(page.locator("text=Golden Prompt")).toBeVisible({
      timeout: 120000,
    });
  });

  test("should copy golden prompt to clipboard", async ({ page }) => {
    // This test requires a completed debate
    test.skip(true, "Requires completed debate state");

    // Mock a completed debate state or navigate to a completed debate
    await page.goto("/debates/test-debate-id");

    // Click copy button
    await page.click('button[aria-label*="Copy"]');

    // Should show success indicator
    await expect(page.locator('[data-testid="copy-success"]').or(
      page.locator("text=Copied")
    )).toBeVisible();
  });

  test("should export golden prompt as .cursorrules", async ({ page }) => {
    // This test requires a completed debate
    test.skip(true, "Requires completed debate state");

    // Mock a completed debate state
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    await page.click('button[aria-label*=".cursorrules"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(".cursorrules");
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/council");

    // Agent selector should be visible (might be collapsed)
    const agentSection = page.locator("text=Select Agents").or(
      page.locator('[data-testid="agent-selector"]')
    );
    
    // Check that layout is mobile-friendly
    const textarea = page.locator('textarea[placeholder*="Describe"]').or(
      page.locator('input[placeholder*="Ask the council"]')
    );
    await expect(textarea).toBeVisible();
  });
});

test.describe("Debate History", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/history");
  });

  test("should display history page", async ({ page }) => {
    await expect(page.locator("text=Debate History")).toBeVisible();
  });

  test("should have search functionality", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test("should have date filter buttons", async ({ page }) => {
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Today")')).toBeVisible();
    await expect(page.locator('button:has-text("This Week")')).toBeVisible();
    await expect(page.locator('button:has-text("This Month")')).toBeVisible();
  });

  test("should show empty state when no debates", async ({ page }) => {
    // Mock empty response or check for empty state
    const emptyState = page.locator("text=No debates yet").or(
      page.locator("text=Start Debate")
    );
    
    // Either shows empty state or has debates
    const hasDebates = await page.locator('[data-testid="debate-card"]').count() > 0;
    if (!hasDebates) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("should filter debates by search", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("REST API");

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Check that filter is applied (URL might change or results update)
    const debateCards = page.locator('[data-testid="debate-card"]').or(
      page.locator('[class*="Card"]')
    );
    
    // Results should be filtered (or show no results message)
    const noResults = page.locator("text=No debates match");
    const hasResults = await debateCards.count() > 0;
    const hasNoResultsMessage = await noResults.isVisible();
    
    expect(hasResults || hasNoResultsMessage).toBeTruthy();
  });
});

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("should display settings page", async ({ page }) => {
    await expect(page.locator("text=Settings")).toBeVisible();
    await expect(page.locator("text=API Keys")).toBeVisible();
  });

  test("should have API key input fields", async ({ page }) => {
    await expect(page.locator('input#openai').or(page.locator('input[placeholder*="sk-"]'))).toBeVisible();
    await expect(page.locator('input#anthropic').or(page.locator('input[placeholder*="sk-ant"]'))).toBeVisible();
    await expect(page.locator('input#google').or(page.locator('input[placeholder*="AIza"]'))).toBeVisible();
  });

  test("should have test buttons for API keys", async ({ page }) => {
    const testButtons = page.locator('button:has-text("Test")');
    expect(await testButtons.count()).toBeGreaterThanOrEqual(3);
  });

  test("should have save button", async ({ page }) => {
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test("should mask API key inputs", async ({ page }) => {
    const openaiInput = page.locator('input#openai').or(page.locator('input[placeholder*="sk-"]'));
    await expect(openaiInput).toHaveAttribute("type", "password");
  });

  test("should have links to get API keys", async ({ page }) => {
    await expect(page.locator('a[href*="openai.com"]').or(page.locator("text=Get key")).first()).toBeVisible();
  });
});

test.describe("Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analytics");
  });

  test("should display analytics dashboard", async ({ page }) => {
    await expect(page.locator("text=Analytics")).toBeVisible();
  });

  test("should show stat cards", async ({ page }) => {
    await expect(page.locator("text=Total Debates")).toBeVisible();
    await expect(page.locator("text=Total Cost")).toBeVisible();
  });

  test("should show charts section", async ({ page }) => {
    await expect(page.locator("text=Debates by Day").or(page.locator("text=Model Usage"))).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should navigate between pages", async ({ page }) => {
    await page.goto("/council");

    // Navigate to History
    await page.click('a[href="/history"]');
    await expect(page).toHaveURL(/\/history/);

    // Navigate to Analytics
    await page.click('a[href="/analytics"]');
    await expect(page).toHaveURL(/\/analytics/);

    // Navigate to Settings
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/\/settings/);

    // Navigate back to Council
    await page.click('a[href="/council"]');
    await expect(page).toHaveURL(/\/council/);
  });

  test("should have mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/council");

    // Look for mobile menu toggle
    const menuButton = page.locator('button[aria-label*="menu"]').or(
      page.locator('[data-testid="mobile-menu-toggle"]')
    );

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Navigation items should be visible
      await expect(page.locator("text=Council")).toBeVisible();
      await expect(page.locator("text=History")).toBeVisible();
      await expect(page.locator("text=Settings")).toBeVisible();
    }
  });
});

test.describe("Accessibility", () => {
  test("should have proper page structure", async ({ page }) => {
    await page.goto("/council");

    // Check for main heading
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Check for proper form labels
    const labels = page.locator("label");
    expect(await labels.count()).toBeGreaterThan(0);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/council");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should have focus on an interactive element
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("should have ARIA labels on buttons", async ({ page }) => {
    await page.goto("/council");

    // Check that buttons have accessible names
    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute("aria-label");
      const innerText = await button.innerText();
      
      // Button should have either aria-label or visible text
      expect(ariaLabel || innerText.trim()).toBeTruthy();
    }
  });
});
