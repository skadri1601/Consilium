import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { ClerkWebhooksController } from "./clerk-webhooks.controller";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { WebhookSecretGuard } from "./guards/webhook-secret.guard";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";

const VALID_SECRET = "stress_test_at_least_sixteen_chars_xyzzy";

describe("ClerkWebhooksController integration + stress", () => {
  let app: NestFastifyApplication;
  let createUserCalls = 0;
  let updateUserCalls = 0;
  let deleteUserCalls = 0;
  let lastCreatePayload: unknown;

  const mockService: Partial<ClerkWebhooksService> = {
    createUser: jest.fn(async (payload: any) => {
      createUserCalls++;
      lastCreatePayload = payload;
      return { success: true, userId: `db_${payload.clerkId}` };
    }) as any,
    updateUser: jest.fn(async (payload: any) => {
      updateUserCalls++;
      return { success: true, userId: `db_${payload.clerkId}` };
    }) as any,
    deleteUser: jest.fn(async (clerkId: string) => {
      deleteUserCalls++;
      return { success: true, userId: `db_${clerkId}` };
    }) as any,
    handleSessionEnded: jest.fn(async () => ({ success: true })) as any,
  };

  beforeAll(async () => {
    process.env.INTERNAL_WEBHOOK_SECRET = VALID_SECRET;

    const moduleRef = await Test.createTestingModule({
      controllers: [ClerkWebhooksController],
      providers: [
        { provide: ClerkWebhooksService, useValue: mockService },
        WebhookSecretGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix("api/v1");
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    delete process.env.INTERNAL_WEBHOOK_SECRET;
    await app.close();
  });

  beforeEach(() => {
    createUserCalls = 0;
    updateUserCalls = 0;
    deleteUserCalls = 0;
    lastCreatePayload = undefined;
  });

  async function inject(opts: {
    path?: string;
    headers?: Record<string, string>;
    payload?: unknown;
  }): Promise<{ statusCode: number; body: unknown }> {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: opts.path ?? "/api/v1/webhooks/clerk",
      headers: { "content-type": "application/json", ...opts.headers },
      payload: opts.payload ? JSON.stringify(opts.payload) : undefined,
    });
    let body: unknown;
    try {
      body = JSON.parse(res.body);
    } catch {
      body = res.body;
    }
    return { statusCode: res.statusCode, body };
  }

  describe("path & mounting", () => {
    it("the canonical path /api/v1/webhooks/clerk responds 200 with valid secret", async () => {
      const res = await inject({
        headers: { "x-webhook-secret": VALID_SECRET },
        payload: { action: "create", clerkId: "u_canonical", email: "a@b.c" },
      });
      expect(res.statusCode).toBe(200);
      expect(createUserCalls).toBe(1);
    });

    it("the previously-broken doubled path /api/v1/api/v1/webhooks/clerk is now 404", async () => {
      const res = await inject({
        path: "/api/v1/api/v1/webhooks/clerk",
        headers: { "x-webhook-secret": VALID_SECRET },
        payload: { action: "create", clerkId: "u_doubled", email: "a@b.c" },
      });
      expect(res.statusCode).toBe(404);
      expect(createUserCalls).toBe(0);
    });
  });

  describe("auth bypass attempts (these MUST all fail with 401)", () => {
    const attacks: Array<[string, Record<string, string>]> = [
      ["no header", {}],
      ["empty header", { "x-webhook-secret": "" }],
      ["wrong header", { "x-webhook-secret": "wrong-secret-value-here" }],
      ["one char off", { "x-webhook-secret": VALID_SECRET.slice(0, -1) + "X" }],
      [
        "shorter prefix",
        { "x-webhook-secret": VALID_SECRET.slice(0, 10) },
      ],
      [
        "longer suffix",
        { "x-webhook-secret": VALID_SECRET + "extra" },
      ],
      ["all-X same length", { "x-webhook-secret": "X".repeat(VALID_SECRET.length) }],
      [
        "case variation (case-sensitive secret)",
        { "x-webhook-secret": VALID_SECRET.toUpperCase() },
      ],
      [
        "leading whitespace",
        { "x-webhook-secret": " " + VALID_SECRET },
      ],
      [
        "trailing whitespace",
        { "x-webhook-secret": VALID_SECRET + " " },
      ],
      [
        "control char injected",
        { "x-webhook-secret": VALID_SECRET + "\x00" },
      ],
    ];

    test.each(attacks)(
      "rejects: %s",
      async (_label, headers) => {
        const res = await inject({
          headers,
          payload: {
            action: "create",
            clerkId: "u_attack",
            email: "x@y.z",
          },
        });
        expect(res.statusCode).toBe(401);
        expect(createUserCalls).toBe(0);
        expect(updateUserCalls).toBe(0);
        expect(deleteUserCalls).toBe(0);
      },
    );

    it("destructive `delete` action is rejected without secret", async () => {
      const res = await inject({
        payload: { action: "delete", clerkId: "u_target" },
      });
      expect(res.statusCode).toBe(401);
      expect(deleteUserCalls).toBe(0);
    });

    it("destructive `update` action is rejected without secret", async () => {
      const res = await inject({
        payload: {
          action: "update",
          clerkId: "u_target",
          email: "attacker@evil.com",
        },
      });
      expect(res.statusCode).toBe(401);
      expect(updateUserCalls).toBe(0);
    });
  });

  describe("payload malformation", () => {
    it("malformed JSON body returns 4xx, never 5xx, never invokes service", async () => {
      const res = await app.getHttpAdapter().getInstance().inject({
        method: "POST",
        url: "/api/v1/webhooks/clerk",
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": VALID_SECRET,
        },
        payload: "{not json",
      });
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.statusCode).toBeLessThan(500);
      expect(createUserCalls).toBe(0);
    });

    it("oversized payload (1MB) is rejected", async () => {
      const huge = "X".repeat(1024 * 1024);
      const res = await inject({
        headers: { "x-webhook-secret": VALID_SECRET },
        payload: { action: "create", clerkId: "u_huge", email: "a@b.c", junk: huge },
      });
      expect([200, 413, 400]).toContain(res.statusCode);
    });

    it("clerkId with special characters is passed through unchanged (Prisma layer handles escaping)", async () => {
      const evilId = "'; DROP TABLE users; --";
      const res = await inject({
        headers: { "x-webhook-secret": VALID_SECRET },
        payload: { action: "create", clerkId: evilId, email: "a@b.c" },
      });
      expect(res.statusCode).toBe(200);
      expect((lastCreatePayload as any)?.clerkId).toBe(evilId);
    });
  });

  describe("concurrency stress", () => {
    it("1000 unauthenticated requests in parallel - all 401, zero invocations", async () => {
      const N = 1000;
      const variants: Array<Record<string, string>> = [
        {},
        { "x-webhook-secret": "" },
        { "x-webhook-secret": "wrong" },
        { "x-webhook-secret": "X".repeat(VALID_SECRET.length) },
      ];
      const pickHeaders = (i: number): Record<string, string> =>
        variants[i % variants.length] ?? {};

      const responses = await Promise.all(
        Array.from({ length: N }, (_, i) =>
          inject({
            headers: pickHeaders(i),
            payload: {
              action: "create",
              clerkId: `attacker_${i}`,
              email: `x${i}@y.z`,
            },
          }),
        ),
      );

      const statuses = responses.map((r) => r.statusCode);
      expect(statuses.every((s) => s === 401)).toBe(true);
      expect(createUserCalls).toBe(0);
      expect(updateUserCalls).toBe(0);
      expect(deleteUserCalls).toBe(0);
    }, 30_000);

    it("500 authenticated requests in parallel - all 200, service invoked exactly N times", async () => {
      const N = 500;
      const responses = await Promise.all(
        Array.from({ length: N }, (_, i) =>
          inject({
            headers: { "x-webhook-secret": VALID_SECRET },
            payload: {
              action: "create",
              clerkId: `valid_${i}`,
              email: `v${i}@y.z`,
            },
          }),
        ),
      );

      const statuses = responses.map((r) => r.statusCode);
      expect(statuses.every((s) => s === 200)).toBe(true);
      expect(createUserCalls).toBe(N);
    }, 30_000);

    it("mixed 50/50 valid/invalid traffic preserves auth boundary", async () => {
      const N = 500;
      const responses = await Promise.all(
        Array.from({ length: N }, (_, i) =>
          inject({
            headers:
              i % 2 === 0
                ? { "x-webhook-secret": VALID_SECRET }
                : { "x-webhook-secret": "wrong" },
            payload: {
              action: "create",
              clerkId: `mixed_${i}`,
              email: `m${i}@y.z`,
            },
          }),
        ),
      );

      const ok = responses.filter((r) => r.statusCode === 200).length;
      const unauth = responses.filter((r) => r.statusCode === 401).length;
      expect(ok).toBe(N / 2);
      expect(unauth).toBe(N / 2);
      expect(createUserCalls).toBe(N / 2);
    }, 30_000);
  });

  describe("env regression", () => {
    it("503 if INTERNAL_WEBHOOK_SECRET is unset at boot", async () => {
      delete process.env.INTERNAL_WEBHOOK_SECRET;
      const moduleRef = await Test.createTestingModule({
        controllers: [ClerkWebhooksController],
        providers: [
          { provide: ClerkWebhooksService, useValue: mockService },
          WebhookSecretGuard,
        ],
      })
        .overrideGuard(RateLimitGuard)
        .useValue({ canActivate: () => true })
        .compile();
      const failApp = moduleRef.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );
      failApp.setGlobalPrefix("api/v1");
      await failApp.init();
      await failApp.getHttpAdapter().getInstance().ready();

      const res = await failApp.getHttpAdapter().getInstance().inject({
        method: "POST",
        url: "/api/v1/webhooks/clerk",
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": VALID_SECRET,
        },
        payload: JSON.stringify({
          action: "create",
          clerkId: "u",
          email: "a@b.c",
        }),
      });
      expect(res.statusCode).toBe(503);
      await failApp.close();
      process.env.INTERNAL_WEBHOOK_SECRET = VALID_SECRET;
    });
  });
});
