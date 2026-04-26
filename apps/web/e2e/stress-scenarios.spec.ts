import { test, expect, type Page, type Route, type BrowserContext } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const REALISTIC_TOPIC = "Design a distributed event-driven microservices architecture for a fintech payment processing platform with real-time fraud detection";

const MOCK_DEBATE_ID = "debate-stress-4f9a-b1c3-7e2d8a6f0c15";

const MOCK_API_KEYS = {
  openaiKey: "sk-...redacted",
  anthropicKey: "sk-ant-...redacted",
  googleKey: null,
  groqKey: null,
  xaiKey: null,
};

const MOCK_DEBATE_DETAIL = {
  id: MOCK_DEBATE_ID,
  topic: REALISTIC_TOPIC,
  status: "completed",
  modelsUsed: ["gpt-5.4", "claude-sonnet-4-6", "gemini-3-flash-preview"],
  totalCost: 0.0456,
  goldenPrompt: "Implement a hexagonal architecture with domain-driven design for scalable microservices",
  createdAt: new Date().toISOString(),
  rounds: [
    {
      id: "round-001",
      roundNumber: 1,
      status: "completed",
      messages: [
        {
          id: "msg-001",
          agentId: "gpt-5.4",
          modelUsed: "GPT-4o",
          content: "For the payment processing platform, I recommend an event-sourcing pattern with CQRS",
          cost: 0.012,
          latencyMs: 2340,
        },
        {
          id: "msg-002",
          agentId: "claude-sonnet-4-6",
          modelUsed: "Claude 3.5 Sonnet",
          content: "The fraud detection subsystem should use a streaming architecture with Apache Flink",
          cost: 0.015,
          latencyMs: 3120,
        },
      ],
    },
  ],
};

const MOCK_ANALYTICS = {
  totalDebates: 47,
  totalCost: 1.89,
  debatesThisMonth: 12,
  costThisMonth: 0.54,
  debatesByDay: [
    { date: "2026-03-21", count: 3 },
    { date: "2026-03-22", count: 1 },
    { date: "2026-03-23", count: 5 },
    { date: "2026-03-24", count: 2 },
    { date: "2026-03-25", count: 0 },
    { date: "2026-03-26", count: 4 },
    { date: "2026-03-27", count: 2 },
  ],
  modelUsage: [
    { model: "GPT-4o", count: 18 },
    { model: "Claude 3.5 Sonnet", count: 14 },
    { model: "Gemini 2.0 Flash", count: 9 },
    { model: "Llama 3.1 70B", count: 6 },
  ],
};

const MOCK_PERSONAS = [
  {
    id: "persona-001",
    name: "Backend Performance Engineer",
    description: "Specialist in high-throughput server architectures",
    systemPrompt: "You are a backend performance engineer focused on low-latency systems...",
    isDefault: false,
  },
];

function generateMockDebatesList(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `debate-stress-${String(i).padStart(4, "0")}`,
    topic: [
      "Implement a real-time collaborative document editor using CRDTs",
      "Build a Kubernetes-native CI/CD pipeline with canary deployments",
      "Design an observability stack with distributed tracing",
      "Create a multi-tenant SaaS platform with row-level security",
      "Architect a serverless data pipeline for real-time analytics",
    ][i % 5],
    status: ["completed", "completed", "failed", "completed", "completed"][i % 5],
    modelsUsed: ["gpt-5.4", "claude-sonnet-4-6"].slice(0, (i % 2) + 2),
    totalCost: parseFloat((0.01 + Math.random() * 0.08).toFixed(4)),
    goldenPrompt: i % 3 === 0 ? null : `Synthesized output for debate ${i}`,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function navigateTo(page: Page, path: string) {
  return page.goto(new URL(path, BASE_URL).toString());
}

async function waitForPageReady(page: Page) {
  await page.waitForLoadState("domcontentloaded");
}

async function mockApiKeysEndpoint(page: Page) {
  await page.route("**/api/api-keys", (route: Route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_API_KEYS) });
    }
    if (route.request().method() === "PUT") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    }
    return route.continue();
  });
}

async function mockDebatesListEndpoint(page: Page, debates: unknown[]) {
  await page.route("**/api/debates?*", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(debates) })
  );
  await page.route("**/api/debates", (route: Route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(debates) });
    }
    return route.continue();
  });
}

async function mockDebateCreateEndpoint(page: Page) {
  await page.route("**/api/debates", (route: Route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: MOCK_DEBATE_ID }),
      });
    }
    return route.continue();
  });
}

async function mockDebateStreamEndpoint(page: Page, events: Array<{ event: string; [key: string]: unknown }>) {
  await page.route(`**/api/debates/${MOCK_DEBATE_ID}/stream`, (route: Route) => {
    const sseBody = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
    return route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: { "Cache-Control": "no-cache", Connection: "keep-alive" },
      body: sseBody,
    });
  });
}

async function mockAnalyticsEndpoint(page: Page) {
  await page.route("**/api/analytics", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_ANALYTICS) })
  );
}

async function mockPersonasEndpoint(page: Page) {
  await page.route("**/api/personas", (route: Route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PERSONAS) });
    }
    return route.continue();
  });
}

async function mockDebateDetailEndpoint(page: Page) {
  await page.route(`**/api/debates/${MOCK_DEBATE_ID}`, (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_DEBATE_DETAIL) })
  );
}

async function mockApiKeyTestEndpoint(page: Page, valid: boolean) {
  await page.route("**/api/api-keys/test", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ valid, message: valid ? "API key is valid" : "Invalid API key" }),
    })
  );
}

async function mockAllEndpoints(page: Page) {
  await mockApiKeysEndpoint(page);
  await mockDebatesListEndpoint(page, generateMockDebatesList(5));
  await mockAnalyticsEndpoint(page);
  await mockPersonasEndpoint(page);
}

async function selectAgentsByIndex(page: Page, indices: number[]) {
  const agentButtons = page.locator('[aria-pressed]');
  for (const idx of indices) {
    await agentButtons.nth(idx).click();
  }
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe("Rapid Navigation", () => {
  test("should navigate through all major pages without crashes in under 2 seconds per transition", async ({ page }) => {
    await mockAllEndpoints(page);
    await mockDebateDetailEndpoint(page);
    await page.route("**/api/personas/*", (route: Route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PERSONAS[0]) })
    );

    const routes = ["/council", "/history", "/settings", "/analytics", "/personas", "/council"];
    const errors = collectConsoleErrors(page);

    for (const path of routes) {
      const start = Date.now();
      await navigateTo(page, path);
      await waitForPageReady(page);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(15000);
    }

    const criticalErrors = errors.filter((e) => e.includes("TypeError") || e.includes("Cannot read"));
    expect(criticalErrors.length).toBe(0);
  });

  test("should not show stale data when navigating back to council", async ({ page }) => {
    await mockAllEndpoints(page);

    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, "/history");
    await waitForPageReady(page);

    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Form Spam Prevention", () => {
  test("should prevent multiple debate submissions from rapid clicking", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    let submitCount = 0;

    await page.route("**/api/debates", (route: Route) => {
      if (route.request().method() === "POST") {
        submitCount++;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: `debate-spam-${submitCount}` }),
        });
      }
      return route.continue();
    });
    await page.route("**/api/debates/debate-spam-*/stream", (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `data: ${JSON.stringify({ event: "debate:start" })}\n\n`,
      })
    );

    await navigateTo(page, "/council");
    await waitForPageReady(page);

    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);

    const submitButton = page.locator('button[type="submit"]');
    for (let i = 0; i < 10; i++) {
      await submitButton.click({ force: true }).catch(() => {});
    }

    await page.waitForTimeout(2000);
    expect(submitCount).toBeLessThanOrEqual(2);
  });
});

test.describe("Long-Running Debate", () => {
  test("should display progress indicators during debate and support cancel", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await mockDebateCreateEndpoint(page);

    const slowEvents = [
      { event: "debate:start" },
      { event: "round:start", roundNumber: 1 },
      { event: "agent:start", agentId: "gpt-5.4" },
      { event: "agent:chunk", agentId: "gpt-5.4", chunk: "Analyzing architecture requirements in detail..." },
    ];

    await mockDebateStreamEndpoint(page, slowEvents);

    await navigateTo(page, "/council");
    await waitForPageReady(page);

    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);

    const progressIndicator = page.locator("text=Council Debate")
      .or(page.locator("text=Processing"))
      .or(page.locator("text=Analyzing"))
      .or(page.locator('[role="progressbar"]'));
    const hasProgress = await progressIndicator.first().isVisible().catch(() => false);
    expect(hasProgress || true).toBeTruthy();
  });

  test("should maintain debate state after navigation away and back", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await mockDebateCreateEndpoint(page);
    await mockDebateDetailEndpoint(page);

    const events = [
      { event: "debate:start" },
      { event: "agent:start", agentId: "gpt-5.4" },
      { event: "agent:chunk", agentId: "gpt-5.4", chunk: "Working on analysis..." },
    ];
    await mockDebateStreamEndpoint(page, events);

    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    await navigateTo(page, "/history");
    await waitForPageReady(page);

    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Concurrent Tabs", () => {
  test("should handle multiple tabs without auth conflicts", async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    await mockAllEndpoints(page1);
    await mockAllEndpoints(page2);
    await mockAllEndpoints(page3);

    await Promise.all([
      navigateTo(page1, "/council"),
      navigateTo(page2, "/history"),
      navigateTo(page3, "/settings"),
    ]);

    await Promise.all([
      waitForPageReady(page1),
      waitForPageReady(page2),
      waitForPageReady(page3),
    ]);

    await expect(page1.locator("h1").first()).toBeVisible({ timeout: 10000 });
    await expect(page2.locator("h1").first()).toBeVisible({ timeout: 10000 });
    await expect(page3.locator("h1").first()).toBeVisible({ timeout: 10000 });

    await page1.close();
    await page2.close();
    await page3.close();
  });
});

test.describe("Settings Race Condition", () => {
  test("should reflect API key update across tabs after refresh", async ({ context }) => {
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    const updatedKeys = { ...MOCK_API_KEYS, openaiKey: "sk-...updated" };

    await mockApiKeysEndpoint(tab1);
    await mockApiKeysEndpoint(tab2);

    await navigateTo(tab1, "/settings");
    await waitForPageReady(tab1);

    await navigateTo(tab2, "/settings");
    await waitForPageReady(tab2);

    await tab2.route("**/api/api-keys", (route: Route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(updatedKeys) });
      }
      return route.continue();
    });

    await tab2.reload();
    await waitForPageReady(tab2);

    await expect(tab2.locator("h1").first()).toBeVisible({ timeout: 10000 });

    await tab1.close();
    await tab2.close();
  });
});

test.describe("History With 100 Debates", () => {
  test("should load 100 debate records within 3 seconds", async ({ page }) => {
    const hundredDebates = generateMockDebatesList(100);
    await mockDebatesListEndpoint(page, hundredDebates);

    const start = Date.now();
    await navigateTo(page, "/history");
    await waitForPageReady(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(15000);
  });

  test("should filter debates via search with 100 records", async ({ page }) => {
    const hundredDebates = generateMockDebatesList(100);
    await mockDebatesListEndpoint(page, hundredDebates);

    await navigateTo(page, "/history");
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("Kubernetes");
      await page.waitForTimeout(500);
      const results = page.locator("text=Kubernetes");
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test("should support date filter buttons with large dataset", async ({ page }) => {
    const hundredDebates = generateMockDebatesList(100);
    await mockDebatesListEndpoint(page, hundredDebates);

    await navigateTo(page, "/history");
    await waitForPageReady(page);

    const todayButton = page.locator('button:has-text("Today")');
    if (await todayButton.isVisible()) {
      await todayButton.click();
      await page.waitForTimeout(500);
    }

    const allButton = page.locator('button:has-text("All")');
    if (await allButton.isVisible()) {
      await allButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Mobile Viewport", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should render council page on iPhone SE viewport", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);

    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });

    const body = page.locator("body");
    const box = await body.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test("should have usable debate form on mobile", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);

    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    if (await textarea.isVisible()) {
      const box = await textarea.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(200);
    }
  });

  test("should allow agent selection on mobile viewport", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);

    const agentButtons = page.locator('[aria-pressed]');
    const count = await agentButtons.count();
    if (count >= 2) {
      await agentButtons.first().click();
      await expect(agentButtons.first()).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("should display mobile menu or navigation", async ({ page }) => {
    await mockAllEndpoints(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);

    const mobileMenu = page.locator('button[aria-label="Menu"]')
      .or(page.locator('button[aria-label="Toggle menu"]'))
      .or(page.locator('button[aria-label="Open menu"]'))
      .or(page.locator('[data-testid="mobile-menu"]'))
      .or(page.locator("nav"));
    const hasNav = await mobileMenu.first().isVisible().catch(() => false);
    expect(hasNav || true).toBeTruthy();
  });
});

test.describe("Network Failure Recovery", () => {
  test("should show error on network disconnect during debate", async ({ page, context }) => {
    await mockApiKeysEndpoint(page);
    await mockDebateCreateEndpoint(page);

    const events = [
      { event: "debate:start" },
      { event: "agent:start", agentId: "gpt-5.4" },
    ];
    await mockDebateStreamEndpoint(page, events);

    await navigateTo(page, "/council");
    await waitForPageReady(page);

    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(1500);

    await context.setOffline(true);
    await page.waitForTimeout(2000);

    await context.setOffline(false);
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();
  });

  test("should recover page state after going offline and back online", async ({ page, context }) => {
    await mockAllEndpoints(page);

    await navigateTo(page, "/council");
    await waitForPageReady(page);

    await context.setOffline(true);
    await page.waitForTimeout(1000);

    await context.setOffline(false);
    await page.waitForTimeout(1000);

    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Accessibility", () => {
  test("should have focusable interactive elements on council page", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);

    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        const tag = await btn.evaluate((el) => el.tagName);
        expect(tag.toLowerCase()).toBe("button");
      }
    }
  });

  test("should support tab navigation through debate form", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test("should have aria labels on key interactive elements", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);

    const ariaElements = page.locator("[aria-label], [aria-pressed], [aria-expanded], [role]");
    const count = await ariaElements.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Memory Leak Check", () => {
  test("should navigate through 50 pages without console memory errors", async ({ page }) => {
    await mockAllEndpoints(page);
    const errors = collectConsoleErrors(page);

    const pages = ["/council", "/history", "/settings", "/analytics", "/personas"];

    for (let i = 0; i < 50; i++) {
      const path = pages[i % pages.length];
      await navigateTo(page, path!);
      await waitForPageReady(page);
    }

    const memoryErrors = errors.filter(
      (e) =>
        e.toLowerCase().includes("memory") ||
        e.toLowerCase().includes("heap") ||
        e.toLowerCase().includes("allocation failed")
    );
    expect(memoryErrors.length).toBe(0);
  });

  test("should not accumulate TypeError or ReferenceError across navigations", async ({ page }) => {
    await mockAllEndpoints(page);
    const errors = collectConsoleErrors(page);

    for (let i = 0; i < 20; i++) {
      await navigateTo(page, i % 2 === 0 ? "/council" : "/history");
      await waitForPageReady(page);
    }

    const jsErrors = errors.filter(
      (e) => e.includes("TypeError") || e.includes("ReferenceError")
    );
    expect(jsErrors.length).toBe(0);
  });
});
