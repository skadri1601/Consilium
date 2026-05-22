import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import * as crypto from "crypto";
import { SentryWebhooksController } from "./sentry-webhooks.controller";
import { SentryWebhooksService } from "./sentry-webhooks.service";
import { LinearTicketService } from "./linear-ticket.service";

const VALID_SECRET = "sentry_test_webhook_secret_at_least_32_chars";

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function makeIssuePayload(overrides: Record<string, unknown> = {}) {
  return {
    action: "created",
    installation: { uuid: "install-uuid-1" },
    actor: { type: "application", id: "app-1", name: "Consilium" },
    data: {
      issue: {
        id: "1001",
        shortId: "CON-42",
        title: "TypeError: Cannot read property 'foo' of undefined",
        culprit: "src/handler.ts in handle",
        permalink: "https://sentry.io/organizations/consilium/issues/1001/",
        level: "error",
        platform: "node",
        project: { id: 1, slug: "consilium-api", name: "Consilium API" },
        metadata: {
          type: "TypeError",
          value: "Cannot read property 'foo' of undefined",
        },
      },
      event: {
        event_id: "evt_abc123",
        environment: "production",
        server_name: "api-1",
        tags: [
          ["browser", "Chrome 120"],
          ["release", "v1.2.3"],
        ],
        level: "error",
      },
      ...((overrides.data as Record<string, unknown>) ?? {}),
    },
    ...overrides,
  };
}

describe("SentryWebhooksController (integration)", () => {
  let app: NestFastifyApplication;
  let createTicket: jest.Mock;
  let findByAttachmentUrl: jest.Mock;
  let addRecurrenceComment: jest.Mock;

  beforeEach(async () => {
    process.env.SENTRY_WEBHOOK_SECRET = VALID_SECRET;

    createTicket = jest.fn(async (input: unknown) => ({
      issueId: "lin_issue_1",
      identifier: "MYC-101",
      url: "https://linear.app/myc/issue/MYC-101",
      input,
    }));
    findByAttachmentUrl = jest.fn(async () => null);
    addRecurrenceComment = jest.fn(async () => ({ ok: true }));

    const moduleRef = await Test.createTestingModule({
      controllers: [SentryWebhooksController],
      providers: [
        SentryWebhooksService,
        {
          provide: LinearTicketService,
          useValue: {
            createTicket,
            findByAttachmentUrl,
            addRecurrenceComment,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
      { rawBody: true },
    );
    app.setGlobalPrefix("api/v1");
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.SENTRY_WEBHOOK_SECRET;
  });

  async function inject(opts: {
    headers?: Record<string, string>;
    rawBody?: string;
    payload?: unknown;
  }): Promise<{ statusCode: number; body: unknown }> {
    const body =
      opts.rawBody !== undefined
        ? opts.rawBody
        : opts.payload !== undefined
          ? JSON.stringify(opts.payload)
          : "";
    const res = await app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: "POST",
        url: "/api/v1/webhooks/sentry",
        headers: { "content-type": "application/json", ...opts.headers },
        payload: body,
      });
    let parsed: unknown;
    try {
      parsed = JSON.parse(res.body);
    } catch {
      parsed = res.body;
    }
    return { statusCode: res.statusCode, body: parsed };
  }

  it("returns 401 when SENTRY_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.SENTRY_WEBHOOK_SECRET;
    const payload = makeIssuePayload();
    const raw = JSON.stringify(payload);
    const res = await inject({
      headers: {
        "sentry-hook-signature": sign(VALID_SECRET, raw),
        "sentry-hook-resource": "issue",
      },
      rawBody: raw,
    });
    expect(res.statusCode).toBe(401);
    expect(createTicket).not.toHaveBeenCalled();
    expect(addRecurrenceComment).not.toHaveBeenCalled();
  });

  it("returns 401 when signature is invalid", async () => {
    const payload = makeIssuePayload();
    const raw = JSON.stringify(payload);
    const res = await inject({
      headers: {
        "sentry-hook-signature": "deadbeef".repeat(8),
        "sentry-hook-resource": "issue",
      },
      rawBody: raw,
    });
    expect(res.statusCode).toBe(401);
    expect(createTicket).not.toHaveBeenCalled();
    expect(addRecurrenceComment).not.toHaveBeenCalled();
  });

  it("creates a Linear ticket on valid issue.created when no existing ticket", async () => {
    findByAttachmentUrl.mockResolvedValueOnce(null);
    const payload = makeIssuePayload();
    const raw = JSON.stringify(payload);
    const res = await inject({
      headers: {
        "sentry-hook-signature": sign(VALID_SECRET, raw),
        "sentry-hook-resource": "issue",
      },
      rawBody: raw,
    });

    expect(res.statusCode).toBe(200);
    expect(findByAttachmentUrl).toHaveBeenCalledWith(
      "https://sentry.io/organizations/consilium/issues/1001/",
    );
    expect(addRecurrenceComment).not.toHaveBeenCalled();
    expect(createTicket).toHaveBeenCalledTimes(1);

    const input = createTicket.mock.calls[0][0];
    expect(input).toMatchObject({
      source: "sentry",
      title: "[Sentry error] TypeError: Cannot read property 'foo' of undefined",
      attachmentUrl: "https://sentry.io/organizations/consilium/issues/1001/",
      attachmentTitle: "Sentry CON-42",
      environment: "production",
      externalId: "CON-42",
      severity: "error",
    });
    expect(typeof input.description).toBe("string");
    expect(input.description).toContain("consilium-api");
    expect(input.description).toContain("production");
    expect(input.description).toContain("src/handler.ts in handle");
    expect(input.description).toContain("evt_abc123");
    expect(input.description).toContain("browser: Chrome 120");

    expect((res.body as { action: string }).action).toBe("create");
    expect((res.body as { identifier: string }).identifier).toBe("MYC-101");
  });

  it("adds a recurrence comment when ticket already exists for the permalink", async () => {
    findByAttachmentUrl.mockResolvedValueOnce({
      issueId: "lin_existing_42",
      identifier: "MYC-7",
      url: "https://linear.app/myc/issue/MYC-7",
    });
    const payload = makeIssuePayload();
    const raw = JSON.stringify(payload);
    const res = await inject({
      headers: {
        "sentry-hook-signature": sign(VALID_SECRET, raw),
        "sentry-hook-resource": "issue",
      },
      rawBody: raw,
    });

    expect(res.statusCode).toBe(200);
    expect(createTicket).not.toHaveBeenCalled();
    expect(addRecurrenceComment).toHaveBeenCalledTimes(1);
    expect(addRecurrenceComment).toHaveBeenCalledWith(
      "lin_existing_42",
      "sentry",
      {
        shortId: "CON-42",
        level: "error",
        culprit: "src/handler.ts in handle",
        environment: "production",
      },
    );
    expect((res.body as { action: string }).action).toBe("comment");
    expect((res.body as { identifier: string }).identifier).toBe("MYC-7");
  });

  it("returns 200 with ignored=true for unknown Sentry-Hook-Resource", async () => {
    const payload = makeIssuePayload();
    const raw = JSON.stringify(payload);
    const res = await inject({
      headers: {
        "sentry-hook-signature": sign(VALID_SECRET, raw),
        "sentry-hook-resource": "comment_made_up_resource",
      },
      rawBody: raw,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true, ignored: true });
    expect(createTicket).not.toHaveBeenCalled();
    expect(addRecurrenceComment).not.toHaveBeenCalled();
  });

  it("creates tickets for warning and info levels (no severity filtering)", async () => {
    for (const level of ["warning", "info"]) {
      findByAttachmentUrl.mockResolvedValueOnce(null);
      const payload = makeIssuePayload({
        data: {
          issue: {
            id: `id-${level}`,
            shortId: `CON-${level}`,
            title: `An ${level}-level problem`,
            culprit: "src/x.ts",
            permalink: `https://sentry.io/issue/${level}/`,
            level,
            platform: "node",
            project: { id: 1, slug: "consilium-api", name: "Consilium API" },
            metadata: { type: "Warn", value: level },
          },
          event: {
            event_id: `ev-${level}`,
            environment: "staging",
            level,
          },
        },
      });
      const raw = JSON.stringify(payload);
      const res = await inject({
        headers: {
          "sentry-hook-signature": sign(VALID_SECRET, raw),
          "sentry-hook-resource": "issue",
        },
        rawBody: raw,
      });

      expect(res.statusCode).toBe(200);
      expect((res.body as { action: string }).action).toBe("create");
    }

    expect(createTicket).toHaveBeenCalledTimes(2);
    const levels = createTicket.mock.calls.map(
      (c) => (c[0] as { severity: string }).severity,
    );
    expect(levels.sort()).toEqual(["info", "warning"]);
    const titles = createTicket.mock.calls.map(
      (c) => (c[0] as { title: string }).title,
    );
    expect(titles).toEqual(
      expect.arrayContaining([
        "[Sentry warning] An warning-level problem",
        "[Sentry info] An info-level problem",
      ]),
    );
  });

  it("routes event_alert resource through handleEventAlert and creates a ticket", async () => {
    findByAttachmentUrl.mockResolvedValueOnce(null);
    const payload = {
      action: "triggered",
      installation: { uuid: "install-uuid-1" },
      data: {
        triggered_rule: "Spike Protection",
        issue: {
          id: "2002",
          shortId: "CON-88",
          title: "High error rate",
          culprit: "queue worker",
          permalink: "https://sentry.io/organizations/consilium/issues/2002/",
          level: "fatal",
          platform: "node",
          project: { id: 1, slug: "consilium-api", name: "Consilium API" },
          metadata: { type: "AlertRule" },
        },
        event: {
          event_id: "evt_alert_1",
          environment: "production",
          level: "fatal",
          server_name: "worker-3",
        },
      },
    };
    const raw = JSON.stringify(payload);
    const res = await inject({
      headers: {
        "sentry-hook-signature": sign(VALID_SECRET, raw),
        "sentry-hook-resource": "event_alert",
      },
      rawBody: raw,
    });

    expect(res.statusCode).toBe(200);
    expect(createTicket).toHaveBeenCalledTimes(1);
    const input = createTicket.mock.calls[0][0];
    expect(input).toMatchObject({
      source: "sentry",
      attachmentUrl: "https://sentry.io/organizations/consilium/issues/2002/",
      environment: "production",
      externalId: "CON-88",
      severity: "fatal",
    });
    expect(input.description).toContain("Spike Protection");
    expect(input.description).toContain("worker-3");
  });
});
