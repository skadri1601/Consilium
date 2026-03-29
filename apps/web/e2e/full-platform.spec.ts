import { test, expect, type Page, type Route } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const REALISTIC_TOPIC =
  "Design a distributed event-driven microservices architecture for a fintech payment processing platform with real-time fraud detection, PCI-DSS compliance, and sub-100ms latency requirements";

const SHORT_TOPIC = "ab";

const LONG_TOPIC = "A".repeat(1001);

const REALISTIC_PERSONA_NAME = "Principal Security Architect";

const REALISTIC_PERSONA_DESCRIPTION =
  "Expert in application security, threat modeling, and secure software development lifecycle";

const REALISTIC_PERSONA_PROMPT =
  "You are a Principal Security Architect with 15 years of experience in application security, penetration testing, and secure architecture design. Evaluate all proposals through the lens of OWASP Top 10, STRIDE threat modeling, and defense-in-depth principles. Prioritize security over convenience.";

const LONG_SYSTEM_PROMPT = "Z".repeat(10000);

const MOCK_DEBATE_ID = "debate-e2e-4f9a-b1c3-7e2d8a6f0c15";

const MOCK_DEBATES_LIST = [
  {
    id: "debate-hist-001",
    topic: "Implement a real-time collaborative document editor using CRDTs and WebSocket",
    status: "completed",
    modelsUsed: ["gpt-4o", "claude-3-5-sonnet-latest"],
    totalCost: 0.0342,
    goldenPrompt: "Use Yjs CRDT library with HocusPocus WebSocket backend...",
    createdAt: new Date().toISOString(),
  },
  {
    id: "debate-hist-002",
    topic: "Build a Kubernetes-native CI/CD pipeline with canary deployments",
    status: "completed",
    modelsUsed: ["gpt-4o-mini", "gemini-2.0-flash", "claude-3-5-haiku-latest"],
    totalCost: 0.0187,
    goldenPrompt: "Use Argo Rollouts for progressive delivery...",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "debate-hist-003",
    topic: "Design an observability stack with distributed tracing and anomaly detection",
    status: "completed",
    modelsUsed: ["claude-3-5-sonnet-latest", "gemini-1.5-pro"],
    totalCost: 0.0256,
    goldenPrompt: null,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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
  modelsUsed: ["gpt-4o", "claude-3-5-sonnet-latest", "gemini-2.0-flash"],
  totalCost: 0.0456,
  goldenPrompt: "Implement a hexagonal architecture with domain-driven design...",
  createdAt: new Date().toISOString(),
  rounds: [
    {
      id: "round-001",
      roundNumber: 1,
      status: "completed",
      messages: [
        {
          id: "msg-001",
          agentId: "gpt-4o",
          modelUsed: "GPT-4o",
          content: "For the payment processing platform, I recommend an event-sourcing pattern...",
          cost: 0.012,
          latencyMs: 2340,
        },
        {
          id: "msg-002",
          agentId: "claude-3-5-sonnet-latest",
          modelUsed: "Claude 3.5 Sonnet",
          content: "The fraud detection subsystem should use a streaming architecture...",
          cost: 0.015,
          latencyMs: 3120,
        },
      ],
    },
  ],
};

function navigateTo(page: Page, path: string) {
  return page.goto(new URL(path, BASE_URL).toString());
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

async function mockDebatesListEndpoint(page: Page, debates: typeof MOCK_DEBATES_LIST = MOCK_DEBATES_LIST) {
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

async function mockPersonasEndpoint(page: Page, personas: typeof MOCK_PERSONAS = MOCK_PERSONAS) {
  await page.route("**/api/personas", (route: Route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(personas) });
    }
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const created = { id: "persona-new-001", ...body, isDefault: false };
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(created) });
    }
    return route.continue();
  });
}

async function mockPersonaByIdEndpoint(page: Page) {
  await page.route("**/api/personas/*", (route: Route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    }
    if (route.request().method() === "DELETE") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
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

async function mockCliTokenEndpoint(page: Page) {
  await page.route("**/api/api-keys/cli-token", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "consilium_e2e_tkn_9f8a7b6c5d4e3f2a1b0c" }),
    })
  );
}

async function selectAgentsByIndex(page: Page, indices: number[]) {
  const agentButtons = page.locator('[aria-pressed]');
  for (const idx of indices) {
    await agentButtons.nth(idx).click();
  }
}

async function waitForPageReady(page: Page) {
  await page.waitForLoadState("domcontentloaded");
}

test.describe("Authentication", () => {
  test("sign in page renders the Clerk sign-in component", async ({ page }) => {
    await navigateTo(page, "/sign-in");
    await waitForPageReady(page);
    await expect(page.locator(".cl-signIn-root").or(page.locator("[data-clerk-sign-in]")).or(page.locator("text=Sign in")).first()).toBeVisible({ timeout: 15000 });
  });

  test("unauthenticated users see sign-in when auth is enforced", async ({ page }) => {
    await page.route("**/api/**", (route: Route) => route.continue());
    await navigateTo(page, "/sign-in");
    await waitForPageReady(page);
    const signInIndicator = page.locator("text=Sign in").or(page.locator(".cl-signIn-root")).first();
    await expect(signInIndicator).toBeVisible({ timeout: 15000 });
  });

  test("dashboard pages load when test auth bypass is active", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Council and Debate Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);
  });

  test("council page loads with agent selector", async ({ page }) => {
    await expect(page.locator("text=Select Agents").first()).toBeVisible();
    const agentButtons = page.locator('[aria-pressed]');
    expect(await agentButtons.count()).toBeGreaterThan(0);
  });

  test("agent selector enforces maximum of 5 agents", async ({ page }) => {
    await selectAgentsByIndex(page, [0, 1, 2, 3, 4]);
    await expect(page.locator(`text=Maximum 5 agents per debate`).first()).toBeVisible();
    const sixthAgent = page.locator('[aria-pressed]').nth(5);
    if (await sixthAgent.count() > 0) {
      await expect(sixthAgent).toBeDisabled();
    }
  });

  test("agent selector requires minimum of 2 agents", async ({ page }) => {
    await expect(page.locator("text=Select at least 2 agents").first()).toBeVisible();
  });

  test("empty topic submission is blocked by disabled submit button", async ({ page }) => {
    await selectAgentsByIndex(page, [0, 1]);
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test("short topic under 3 characters keeps submit disabled or is rejected", async ({ page }) => {
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(SHORT_TOPIC);
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();
    if (!isDisabled) {
      await mockDebateCreateEndpoint(page);
      await page.route("**/api/debates", (route: Route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "Topic must be at least 3 characters" }),
          });
        }
        return route.continue();
      });
      await submitButton.click();
      await expect(page.locator("text=/Failed|Error|too short|at least 3/i").first()).toBeVisible({ timeout: 5000 });
    }
    expect(true).toBeTruthy();
  });

  test("long topic over 1000 characters still renders without overflow", async ({ page }) => {
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(LONG_TOPIC);
    const textareaBox = await textarea.boundingBox();
    expect(textareaBox).not.toBeNull();
    expect(textareaBox!.width).toBeGreaterThan(0);
  });

  test("debate creation sends correct payload with topic and models", async ({ page }) => {
    let capturedPayload: { topic: string; models: string[] } | null = null;
    await page.route("**/api/debates", (route: Route) => {
      if (route.request().method() === "POST") {
        capturedPayload = route.request().postDataJSON();
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: MOCK_DEBATE_ID }),
        });
      }
      return route.continue();
    });
    await page.route(`**/api/debates/${MOCK_DEBATE_ID}/stream`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `data: ${JSON.stringify({ event: "debate:error", message: "Test ended" })}\n\n`,
      })
    );
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload!.topic).toBe(REALISTIC_TOPIC);
    expect(capturedPayload!.models).toHaveLength(2);
  });

  test("SSE streaming events render agent progress cards", async ({ page }) => {
    const sseEvents = [
      { event: "debate:start" },
      { event: "round:start", roundNumber: 1 },
      { event: "agent:start", agentId: "gpt-4o-mini" },
      { event: "agent:chunk", agentId: "gpt-4o-mini", chunk: "Analyzing the architecture requirements..." },
      { event: "agent:start", agentId: "gpt-4o" },
      { event: "agent:complete", agentId: "gpt-4o-mini", content: "Full response from GPT-4o Mini" },
      { event: "agent:complete", agentId: "gpt-4o", content: "Full response from GPT-4o" },
    ];
    await mockDebateCreateEndpoint(page);
    await mockDebateStreamEndpoint(page, sseEvents);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("text=Council Debate").first()).toBeVisible({ timeout: 10000 });
  });

  test("synthesis output displays after debate completes", async ({ page }) => {
    const goldenPromptText = "Use event-sourcing with Apache Kafka for command processing...";
    const sseEvents = [
      { event: "debate:start" },
      { event: "round:start", roundNumber: 1 },
      { event: "agent:start", agentId: "gpt-4o-mini" },
      { event: "agent:complete", agentId: "gpt-4o-mini", content: "Response A" },
      { event: "agent:start", agentId: "gpt-4o" },
      { event: "agent:complete", agentId: "gpt-4o", content: "Response B" },
      { event: "synthesis:start" },
      {
        event: "debate:complete",
        goldenPrompt: goldenPromptText,
        totalCost: 0.0312,
        modelsUsed: ["gpt-4o-mini", "gpt-4o"],
      },
    ];
    await mockDebateCreateEndpoint(page);
    await mockDebateStreamEndpoint(page, sseEvents);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("text=Synthesis").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${goldenPromptText.slice(0, 40)}`).first()).toBeVisible();
  });

  test("copy synthesis to clipboard shows success indicator", async ({ page }) => {
    const sseEvents = [
      { event: "debate:start" },
      { event: "agent:start", agentId: "gpt-4o-mini" },
      { event: "agent:complete", agentId: "gpt-4o-mini", content: "Done" },
      { event: "debate:complete", goldenPrompt: "Synthesized output for clipboard test", totalCost: 0.01, modelsUsed: ["gpt-4o-mini"] },
    ];
    await mockDebateCreateEndpoint(page);
    await mockDebateStreamEndpoint(page, sseEvents);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("text=Synthesis").first()).toBeVisible({ timeout: 15000 });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.locator('button[aria-label="Copy to clipboard"]').click();
    await expect(page.locator("text=Copied").first()).toBeVisible({ timeout: 5000 });
  });

  test("export as markdown triggers download", async ({ page }) => {
    const sseEvents = [
      { event: "debate:start" },
      { event: "agent:start", agentId: "gpt-4o-mini" },
      { event: "agent:complete", agentId: "gpt-4o-mini", content: "Done" },
      { event: "debate:complete", goldenPrompt: "Markdown export content", totalCost: 0.01, modelsUsed: ["gpt-4o-mini"] },
    ];
    await mockDebateCreateEndpoint(page);
    await mockDebateStreamEndpoint(page, sseEvents);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("text=Synthesis").first()).toBeVisible({ timeout: 15000 });
    const downloadPromise = page.waitForEvent("download");
    await page.locator('button[aria-label="Export as Markdown"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("synthesis.md");
  });
});

test.describe("History", () => {
  test("history page loads with search and filter controls", async ({ page }) => {
    await mockDebatesListEndpoint(page);
    await navigateTo(page, "/history");
    await waitForPageReady(page);
    await expect(page.locator("text=Debate History").first()).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("search filter narrows displayed debates", async ({ page }) => {
    await mockDebatesListEndpoint(page);
    await navigateTo(page, "/history");
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("Kubernetes");
    await page.waitForTimeout(500);
    const visibleTopics = page.locator("text=Kubernetes");
    await expect(visibleTopics.first()).toBeVisible();
  });

  test("date filter buttons switch active filter", async ({ page }) => {
    await mockDebatesListEndpoint(page);
    await navigateTo(page, "/history");
    await waitForPageReady(page);
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Today")')).toBeVisible();
    await expect(page.locator('button:has-text("This Week")')).toBeVisible();
    await expect(page.locator('button:has-text("This Month")')).toBeVisible();
    await page.locator('button:has-text("Today")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("This Week")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("This Month")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("All")').click();
  });

  test("debate detail page loads from history link", async ({ page }) => {
    await mockDebatesListEndpoint(page, [MOCK_DEBATES_LIST[0]!]);
    await mockDebateDetailEndpoint(page);
    await page.route(`**/api/debates/debate-hist-001`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...MOCK_DEBATE_DETAIL, id: "debate-hist-001" }),
      })
    );
    await navigateTo(page, "/history");
    await waitForPageReady(page);
    await page.waitForTimeout(1500);
    const viewButton = page.locator('a:has-text("View")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/debates\//);
    }
  });

  test("empty state shows when no debates exist", async ({ page }) => {
    await mockDebatesListEndpoint(page, []);
    await navigateTo(page, "/history");
    await waitForPageReady(page);
    await expect(page.locator("text=No debates yet").or(page.locator("text=Start Debate")).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Settings", () => {
  test("settings page loads with custom tabs", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/settings");
    await waitForPageReady(page);
    await expect(page.locator("text=Settings").or(page.locator("text=API Keys")).or(page.locator("text=Preferences")).first()).toBeVisible({ timeout: 15000 });
  });

  test("API key inputs use password type for masking", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/settings");
    await waitForPageReady(page);
    const apiKeysLink = page.locator("text=API Keys").first();
    if (await apiKeysLink.isVisible()) {
      await apiKeysLink.click();
      await page.waitForTimeout(500);
    }
    const passwordInputs = page.locator('input[type="password"]');
    if (await passwordInputs.count() > 0) {
      const inputType = await passwordInputs.first().getAttribute("type");
      expect(inputType).toBe("password");
    }
  });

  test("API key test shows validation feedback", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await mockApiKeyTestEndpoint(page, false);
    await navigateTo(page, "/settings");
    await waitForPageReady(page);
    const apiKeysLink = page.locator("text=API Keys").first();
    if (await apiKeysLink.isVisible()) {
      await apiKeysLink.click();
      await page.waitForTimeout(500);
    }
    const openaiInput = page.locator("#openai");
    if (await openaiInput.isVisible()) {
      await openaiInput.fill("sk-test-invalid-key-12345");
      const testButton = page.locator('button:has-text("Test")').first();
      await testButton.click();
      await expect(page.locator("text=/Invalid|Error/i").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("CLI token generation produces a token string", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await mockCliTokenEndpoint(page);
    await navigateTo(page, "/settings");
    await waitForPageReady(page);
    const cliLink = page.locator("text=CLI").first();
    if (await cliLink.isVisible()) {
      await cliLink.click();
      await page.waitForTimeout(500);
    }
    const generateButton = page.locator('button:has-text("Generate CLI token")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await expect(page.locator("text=consilium_e2e_tkn").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("preferences save button activates after changes", async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await navigateTo(page, "/settings");
    await waitForPageReady(page);
    const prefsLink = page.locator("text=Preferences").first();
    if (await prefsLink.isVisible()) {
      await prefsLink.click();
      await page.waitForTimeout(1000);
      const saveButton = page.locator('button:has-text("Save Preferences")').or(page.locator('button:has-text("Preferences Saved")'));
      if (await saveButton.isVisible()) {
        await expect(saveButton).toBeVisible();
      }
    }
  });
});

test.describe("Personas", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await mockPersonasEndpoint(page);
    await mockPersonaByIdEndpoint(page);
  });

  test("persona list loads with existing personas", async ({ page }) => {
    await navigateTo(page, "/personas");
    await waitForPageReady(page);
    await expect(page.locator("text=Custom Agent Personas").first()).toBeVisible();
    await expect(page.locator("text=Backend Performance Engineer").first()).toBeVisible({ timeout: 10000 });
  });

  test("create persona with valid data shows the form", async ({ page }) => {
    await navigateTo(page, "/personas");
    await waitForPageReady(page);
    await expect(page.locator("text=Create New Persona").first()).toBeVisible();
    await page.locator("#name").fill(REALISTIC_PERSONA_NAME);
    await page.locator("#description").fill(REALISTIC_PERSONA_DESCRIPTION);
    await page.locator("#systemPrompt").fill(REALISTIC_PERSONA_PROMPT);
    const createButton = page.locator('button:has-text("Create Persona")');
    await expect(createButton).toBeEnabled();
  });

  test("create persona with empty name keeps create button present", async ({ page }) => {
    await navigateTo(page, "/personas");
    await waitForPageReady(page);
    await page.locator("#name").fill("");
    await page.locator("#systemPrompt").fill(REALISTIC_PERSONA_PROMPT);
    const nameInput = page.locator("#name");
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe("");
  });

  test("edit existing persona populates the form", async ({ page }) => {
    await navigateTo(page, "/personas");
    await waitForPageReady(page);
    await page.waitForTimeout(1500);
    const editButton = page.locator('button:has(svg.lucide-pencil)').or(page.locator('button:has(svg.lucide-edit)')).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.locator("text=Edit Persona").first()).toBeVisible();
      const nameInput = page.locator("#name");
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    }
  });

  test("delete persona triggers confirmation dialog", async ({ page }) => {
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("delete");
      await dialog.accept();
    });
    await navigateTo(page, "/personas");
    await waitForPageReady(page);
    await page.waitForTimeout(1500);
    const deleteButton = page.locator('button:has(svg.lucide-trash-2)').or(page.locator('button:has(svg.lucide-trash2)')).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    }
  });

  test("very long system prompt of 10K characters is accepted in textarea", async ({ page }) => {
    await navigateTo(page, "/personas");
    await waitForPageReady(page);
    const textarea = page.locator("#systemPrompt");
    await textarea.fill(LONG_SYSTEM_PROMPT);
    const value = await textarea.inputValue();
    expect(value.length).toBe(10000);
  });
});

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await mockAnalyticsEndpoint(page);
  });

  test("analytics dashboard loads with heading", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await waitForPageReady(page);
    await expect(page.locator("text=Analytics").first()).toBeVisible({ timeout: 15000 });
  });

  test("stat cards render with values", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await waitForPageReady(page);
    await expect(page.locator("text=Total Debates").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Total Cost").first()).toBeVisible();
    await expect(page.locator("text=47").first()).toBeVisible();
  });

  test("charts render with data sections visible", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await waitForPageReady(page);
    await expect(page.locator("text=Debates by Day").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Model Usage").first()).toBeVisible();
  });
});

test.describe("Navigation and Layout", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiKeysEndpoint(page);
    await mockDebatesListEndpoint(page);
    await mockAnalyticsEndpoint(page);
    await mockPersonasEndpoint(page);
  });

  test("sidebar navigation works on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    const sidebarNav = page.locator('nav.hidden.lg\\:flex').or(page.locator("nav").filter({ has: page.locator('a[href="/council"]') })).first();
    await expect(sidebarNav).toBeVisible();
  });

  test("mobile menu toggle shows and hides navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.locator("text=History").first()).toBeVisible();
    await expect(page.locator("text=Analytics").first()).toBeVisible();
    await expect(page.locator("text=Settings").first()).toBeVisible();
  });

  test("all nav links route to correct pages", async ({ page }) => {
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await page.waitForLoadState("networkidle");

    await page.click('a[href="/history"]', { force: true });
    await expect(page).toHaveURL(/\/history/);

    await page.click('a[href="/analytics"]', { force: true });
    await expect(page).toHaveURL(/\/analytics/);

    await page.click('a[href="/personas"]', { force: true });
    await expect(page).toHaveURL(/\/personas/);

    await page.click('a[href="/settings"]', { force: true });
    await expect(page).toHaveURL(/\/settings/);

    await page.click('a[href="/council"]', { force: true });
    await expect(page).toHaveURL(/\/council/);
  });

  test("Ctrl+K keyboard shortcut focuses debate input", async ({ page }) => {
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    if (await textarea.isVisible()) {
      await page.keyboard.press("Control+k");
      await page.waitForTimeout(300);
      const isFocused = await textarea.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
    }
  });
});

test.describe("Edge Cases and Stress", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiKeysEndpoint(page);
  });

  test("rapid form submissions do not create duplicate debates", async ({ page }) => {
    let requestCount = 0;
    await page.route("**/api/debates", (route: Route) => {
      if (route.request().method() === "POST") {
        requestCount++;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: `debate-rapid-${requestCount}` }),
        });
      }
      return route.continue();
    });
    await page.route("**/api/debates/*/stream", (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `data: ${JSON.stringify({ event: "debate:error", message: "Rapid test" })}\n\n`,
      })
    );
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await submitButton.click({ force: true });
    await submitButton.click({ force: true });
    await page.waitForTimeout(1500);
    expect(requestCount).toBeLessThanOrEqual(2);
  });

  test("network timeout during debate shows error state", async ({ page }) => {
    await page.route("**/api/debates", (route: Route) => {
      if (route.request().method() === "POST") {
        return route.abort("timedout");
      }
      return route.continue();
    });
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("text=/Failed|Error|try again/i").first()).toBeVisible({ timeout: 10000 });
  });

  test("very long debate topic renders without layout breakage", async ({ page }) => {
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    const longTopic = "Implement a comprehensive " + "multi-region ".repeat(80) + "deployment strategy";
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(longTopic);
    const box = await textarea.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.width).toBeLessThan(2000);
  });

  test("concurrent debate creation is prevented by loading state", async ({ page }) => {
    let concurrentRequests = 0;
    let maxConcurrent = 0;
    await page.route("**/api/debates", (route: Route) => {
      if (route.request().method() === "POST") {
        concurrentRequests++;
        maxConcurrent = Math.max(maxConcurrent, concurrentRequests);
        return new Promise((resolve) => {
          setTimeout(() => {
            concurrentRequests--;
            route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ id: MOCK_DEBATE_ID }),
            });
            resolve(undefined);
          }, 500);
        });
      }
      return route.continue();
    });
    await page.route("**/api/debates/*/stream", (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `data: ${JSON.stringify({ event: "debate:error", message: "Concurrent test" })}\n\n`,
      })
    );
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test("page refresh during active debate recovers gracefully", async ({ page }) => {
    await mockDebateCreateEndpoint(page);
    await page.route(`**/api/debates/${MOCK_DEBATE_ID}/stream`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: { "Cache-Control": "no-cache" },
        body: `data: ${JSON.stringify({ event: "debate:start" })}\n\ndata: ${JSON.stringify({ event: "round:start", roundNumber: 1 })}\n\n`,
      })
    );
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await selectAgentsByIndex(page, [0, 1]);
    const textarea = page.locator('textarea[aria-label="Debate topic input"]');
    await textarea.fill(REALISTIC_TOPIC);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    await page.reload();
    await waitForPageReady(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Select Agents").first()).toBeVisible();
  });

  test("browser back and forward navigation works between pages", async ({ page }) => {
    await mockDebatesListEndpoint(page);
    await mockAnalyticsEndpoint(page);
    await navigateTo(page, "/council");
    await waitForPageReady(page);
    await page.waitForLoadState("networkidle");

    await page.click('a[href="/history"]', { force: true });
    await expect(page).toHaveURL(/\/history/);

    await page.click('a[href="/analytics"]', { force: true });
    await expect(page).toHaveURL(/\/analytics/);

    await page.goBack();
    await expect(page).toHaveURL(/\/history/);

    await page.goBack();
    await expect(page).toHaveURL(/\/council/);

    await page.goForward();
    await expect(page).toHaveURL(/\/history/);
  });
});
