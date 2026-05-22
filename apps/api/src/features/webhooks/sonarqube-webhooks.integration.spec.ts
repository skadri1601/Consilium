import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import * as crypto from "crypto";
import { SonarqubeWebhooksController } from "./sonarqube-webhooks.controller";
import {
  SonarqubeWebhooksService,
  type SonarqubeWebhookPayload,
} from "./sonarqube-webhooks.service";
import {
  LinearTicketService,
  type CreateTicketInput,
  type LinearTicket,
} from "./linear-ticket.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";

const VALID_SECRET = "test_sonarqube_webhook_secret_at_least_long";
const SIGNATURE_HEADER = "x-sonar-webhook-hmac-sha256";

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function basePayload(
  overrides: Partial<SonarqubeWebhookPayload> = {},
): SonarqubeWebhookPayload {
  return {
    serverUrl: "https://sonar.example.com",
    taskId: "task-123",
    status: "SUCCESS",
    analysedAt: "2026-05-22T12:00:00+0000",
    revision: "abc123",
    branch: { name: "main", type: "LONG", isMain: true },
    project: {
      key: "consilium-api",
      name: "Consilium API",
      url: "https://sonar.example.com/dashboard?id=consilium-api",
    },
    qualityGate: {
      name: "Default",
      status: "OK",
      conditions: [],
    },
    ...overrides,
  };
}

describe("SonarqubeWebhooksController integration", () => {
  let app: NestFastifyApplication;

  const findByAttachmentUrl = jest.fn<Promise<LinearTicket | null>, [string]>();
  const createTicket = jest.fn<Promise<LinearTicket>, [CreateTicketInput]>();
  const addRecurrenceComment = jest.fn<
    Promise<void>,
    [string, "sentry" | "sonarqube", Record<string, string>]
  >();

  const mockLinear = {
    findByAttachmentUrl: (url: string) => findByAttachmentUrl(url),
    createTicket: (input: CreateTicketInput) => createTicket(input),
    addRecurrenceComment: (
      issueId: string,
      source: "sentry" | "sonarqube",
      ctx: Record<string, string>,
    ) => addRecurrenceComment(issueId, source, ctx),
  };

  async function buildApp(): Promise<NestFastifyApplication> {
    const moduleRef = await Test.createTestingModule({
      controllers: [SonarqubeWebhooksController],
      providers: [
        SonarqubeWebhooksService,
        { provide: LinearTicketService, useValue: mockLinear },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const built = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
      { rawBody: true },
    );
    built.setGlobalPrefix("api/v1");
    await built.init();
    await built.getHttpAdapter().getInstance().ready();
    return built;
  }

  beforeAll(async () => {
    process.env.SONARQUBE_WEBHOOK_SECRET = VALID_SECRET;
    app = await buildApp();
  });

  afterAll(async () => {
    delete process.env.SONARQUBE_WEBHOOK_SECRET;
    await app.close();
  });

  beforeEach(() => {
    findByAttachmentUrl.mockReset();
    createTicket.mockReset();
    addRecurrenceComment.mockReset();
    findByAttachmentUrl.mockResolvedValue(null);
    createTicket.mockResolvedValue({
      issueId: "issue-1",
      identifier: "MYC-1",
      url: "https://linear.app/myc/issue/MYC-1",
    });
    addRecurrenceComment.mockResolvedValue(undefined);
  });

  async function post(opts: {
    payload: unknown;
    secret?: string | null;
    forcedSignature?: string;
  }): Promise<{ statusCode: number; body: unknown }> {
    const body =
      typeof opts.payload === "string"
        ? opts.payload
        : JSON.stringify(opts.payload);
    const sig =
      opts.forcedSignature !== undefined
        ? opts.forcedSignature
        : opts.secret === null
          ? ""
          : sign(opts.secret ?? VALID_SECRET, body);

    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (sig) headers[SIGNATURE_HEADER] = sig;

    const res = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/webhooks/sonarqube",
      headers,
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

  it("returns 401 when SONARQUBE_WEBHOOK_SECRET is missing", async () => {
    delete process.env.SONARQUBE_WEBHOOK_SECRET;
    const failApp = await buildApp();

    const payload = basePayload();
    const sig = sign(VALID_SECRET, JSON.stringify(payload));
    const res = await failApp
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: "POST",
        url: "/api/v1/webhooks/sonarqube",
        headers: {
          "content-type": "application/json",
          [SIGNATURE_HEADER]: sig,
        },
        payload: JSON.stringify(payload),
      });
    expect(res.statusCode).toBe(401);
    expect(createTicket).not.toHaveBeenCalled();
    expect(addRecurrenceComment).not.toHaveBeenCalled();
    await failApp.close();
    process.env.SONARQUBE_WEBHOOK_SECRET = VALID_SECRET;
  });

  it("returns 401 on bad signature", async () => {
    const res = await post({
      payload: basePayload({ qualityGate: { status: "ERROR" } }),
      forcedSignature: "deadbeef".repeat(8),
    });
    expect(res.statusCode).toBe(401);
    expect(createTicket).not.toHaveBeenCalled();
    expect(addRecurrenceComment).not.toHaveBeenCalled();
  });

  it("returns 401 on missing signature header", async () => {
    const res = await post({ payload: basePayload(), forcedSignature: "" });
    expect(res.statusCode).toBe(401);
    expect(createTicket).not.toHaveBeenCalled();
  });

  it("accepts uppercase hex signature (case-insensitive compare)", async () => {
    const payload = basePayload({
      qualityGate: { status: "OK", conditions: [] },
    });
    const body = JSON.stringify(payload);
    const upper = sign(VALID_SECRET, body).toUpperCase();
    const res = await post({ payload, forcedSignature: upper });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ignored: true });
  });

  it("valid signature + qualityGate OK -> 200 ignored, no Linear calls", async () => {
    const res = await post({
      payload: basePayload({
        qualityGate: { name: "Default", status: "OK", conditions: [] },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      received: true,
      ignored: true,
      reason: "gate ok",
    });
    expect(findByAttachmentUrl).not.toHaveBeenCalled();
    expect(createTicket).not.toHaveBeenCalled();
    expect(addRecurrenceComment).not.toHaveBeenCalled();
  });

  it("valid signature + ERROR on main branch + no existing -> createTicket called with environment=production", async () => {
    const payload = basePayload({
      qualityGate: {
        name: "Default",
        status: "ERROR",
        conditions: [
          {
            metric: "new_coverage",
            status: "ERROR",
            value: "55",
            errorThreshold: "80",
            operator: "LESS_THAN",
          },
          {
            metric: "new_security_rating",
            status: "ERROR",
            value: "3",
            errorThreshold: "1",
          },
          {
            metric: "duplicated_lines_density",
            status: "OK",
            value: "1.0",
            errorThreshold: "3.0",
          },
        ],
      },
    });

    const res = await post({ payload });
    expect(res.statusCode).toBe(200);
    expect(findByAttachmentUrl).toHaveBeenCalledTimes(1);
    expect(createTicket).toHaveBeenCalledTimes(1);
    expect(addRecurrenceComment).not.toHaveBeenCalled();

    const arg = createTicket.mock.calls[0]?.[0] as CreateTicketInput;
    expect(arg.source).toBe("sonarqube");
    expect(arg.environment).toBe("production");
    expect(arg.title).toContain("[SonarQube]");
    expect(arg.title).toContain("Consilium API");
    expect(arg.title).toContain("main");
    expect(arg.externalId).toContain("consilium-api");
    expect(arg.externalId).toContain("main");
    expect(arg.externalId).toContain("2026-05-22T12:00:00+0000");
    expect(arg.attachmentTitle).toBe("SonarQube Consilium API (main)");
    expect(arg.attachmentUrl).toBe(
      "https://sonar.example.com/dashboard?id=consilium-api",
    );
    expect(arg.description).toContain("new_coverage");
    expect(arg.description).toContain("80");
    expect(arg.description).toContain("new_security_rating");
    expect(arg.description).not.toContain("duplicated_lines_density");
  });

  it("valid signature + ERROR on non-main branch -> createTicket called with environment=development", async () => {
    const payload = basePayload({
      branch: { name: "feature/x", type: "BRANCH", isMain: false },
      qualityGate: {
        name: "Default",
        status: "ERROR",
        conditions: [
          {
            metric: "bugs",
            status: "ERROR",
            value: "5",
            errorThreshold: "0",
          },
        ],
      },
    });

    const res = await post({ payload });
    expect(res.statusCode).toBe(200);
    expect(createTicket).toHaveBeenCalledTimes(1);
    const arg = createTicket.mock.calls[0]?.[0] as CreateTicketInput;
    expect(arg.environment).toBe("development");
    expect(arg.title).toContain("(feature/x)");
    expect(arg.externalId).toContain("feature/x");
  });

  it("valid signature + ERROR + existing ticket -> addRecurrenceComment called, NOT createTicket", async () => {
    findByAttachmentUrl.mockResolvedValue({
      issueId: "existing-issue-id",
      identifier: "MYC-99",
      url: "https://linear.app/myc/issue/MYC-99",
    });

    const payload = basePayload({
      qualityGate: {
        name: "Default",
        status: "ERROR",
        conditions: [
          {
            metric: "code_smells",
            status: "ERROR",
            value: "100",
            errorThreshold: "10",
          },
          {
            metric: "bugs",
            status: "ERROR",
            value: "3",
            errorThreshold: "0",
          },
        ],
      },
    });

    const res = await post({ payload });
    expect(res.statusCode).toBe(200);
    expect(findByAttachmentUrl).toHaveBeenCalledTimes(1);
    expect(createTicket).not.toHaveBeenCalled();
    expect(addRecurrenceComment).toHaveBeenCalledTimes(1);

    const [issueId, source, ctx] = addRecurrenceComment.mock.calls[0] ?? [];
    expect(issueId).toBe("existing-issue-id");
    expect(source).toBe("sonarqube");
    expect(ctx).toMatchObject({
      project: "consilium-api",
      branch: "main",
      failedConditions: "2",
    });
  });

  it("falls back to constructed dashboard URL when project.url is missing", async () => {
    const payload = basePayload({
      project: { key: "consilium-api", name: "Consilium API" },
      qualityGate: {
        name: "Default",
        status: "ERROR",
        conditions: [
          {
            metric: "bugs",
            status: "ERROR",
            value: "1",
            errorThreshold: "0",
          },
        ],
      },
    });

    const res = await post({ payload });
    expect(res.statusCode).toBe(200);
    const arg = createTicket.mock.calls[0]?.[0] as CreateTicketInput;
    expect(arg.attachmentUrl).toContain(
      "https://sonar.example.com/dashboard?id=consilium-api",
    );
    expect(arg.attachmentUrl).toContain("branch=main");
  });
});
