import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { ClerkWebhooksController } from "./clerk-webhooks.controller";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";

const VALID_SECRET = "whsec_test_secret_at_least_sixteen_chars_xyzzy";
const VALID_SVIX_ID = "msg_test_id_12345";
const VALID_SVIX_TIMESTAMP = "1700000000";
const VALID_SVIX_SIGNATURE = "v1,test_signature_placeholder_value_xyz";

const mockVerify = jest.fn();

jest.mock("svix", () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: (...args: unknown[]) => mockVerify(...args),
  })),
}));

function buildUserEvent(
  type: "user.created" | "user.updated" | "user.deleted",
  clerkId: string,
  email = "a@b.c",
): unknown {
  return {
    type,
    data: {
      id: clerkId,
      email_addresses: [{ id: "e1", email_address: email }],
      primary_email_address_id: "e1",
      first_name: null,
      last_name: null,
      image_url: null,
    },
  };
}

function buildSvixHeaders(
  overrides: Record<string, string | undefined> = {},
): Record<string, string> {
  const base: Record<string, string | undefined> = {
    "svix-id": VALID_SVIX_ID,
    "svix-timestamp": VALID_SVIX_TIMESTAMP,
    "svix-signature": VALID_SVIX_SIGNATURE,
    ...overrides,
  };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

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
    process.env.CLERK_WEBHOOK_SECRET = VALID_SECRET;

    const moduleRef = await Test.createTestingModule({
      controllers: [ClerkWebhooksController],
      providers: [{ provide: ClerkWebhooksService, useValue: mockService }],
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
    delete process.env.CLERK_WEBHOOK_SECRET;
    await app.close();
  });

  beforeEach(() => {
    createUserCalls = 0;
    updateUserCalls = 0;
    deleteUserCalls = 0;
    lastCreatePayload = undefined;
    mockVerify.mockReset();
    mockVerify.mockImplementation((body: string) => JSON.parse(body));
  });

  async function inject(opts: {
    path?: string;
    headers?: Record<string, string>;
    payload?: unknown;
    rawPayload?: string;
  }): Promise<{ statusCode: number; body: unknown }> {
    const res = await app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: "POST",
        url: opts.path ?? "/api/v1/webhooks/clerk",
        headers: { "content-type": "application/json", ...opts.headers },
        payload:
          opts.rawPayload !== undefined
            ? opts.rawPayload
            : opts.payload
              ? JSON.stringify(opts.payload)
              : undefined,
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
    it("the canonical path /api/v1/webhooks/clerk responds 200 with valid signature", async () => {
      const res = await inject({
        headers: buildSvixHeaders(),
        payload: buildUserEvent("user.created", "u_canonical"),
      });
      expect(res.statusCode).toBe(200);
      expect(createUserCalls).toBe(1);
    });

    it("the previously-broken doubled path /api/v1/api/v1/webhooks/clerk is now 404", async () => {
      const res = await inject({
        path: "/api/v1/api/v1/webhooks/clerk",
        headers: buildSvixHeaders(),
        payload: buildUserEvent("user.created", "u_doubled"),
      });
      expect(res.statusCode).toBe(404);
      expect(createUserCalls).toBe(0);
    });
  });

  describe("auth bypass attempts (these MUST all fail with 401)", () => {
    const attacks: Array<[string, Record<string, string>]> = [
      ["no headers", {}],
      ["missing svix-id", buildSvixHeaders({ "svix-id": undefined })],
      [
        "missing svix-timestamp",
        buildSvixHeaders({ "svix-timestamp": undefined }),
      ],
      [
        "missing svix-signature",
        buildSvixHeaders({ "svix-signature": undefined }),
      ],
      ["empty svix-id", buildSvixHeaders({ "svix-id": "" })],
      ["empty svix-signature", buildSvixHeaders({ "svix-signature": "" })],
    ];

    test.each(attacks)("rejects: %s", async (_label, headers) => {
      const res = await inject({
        headers,
        payload: buildUserEvent("user.created", "u_attack"),
      });
      expect(res.statusCode).toBe(401);
      expect(createUserCalls).toBe(0);
      expect(updateUserCalls).toBe(0);
      expect(deleteUserCalls).toBe(0);
    });

    const forgedSignatures: Array<[string, string]> = [
      ["one char off", VALID_SVIX_SIGNATURE.slice(0, -1) + "X"],
      ["shorter prefix", VALID_SVIX_SIGNATURE.slice(0, 10)],
      ["longer suffix", VALID_SVIX_SIGNATURE + "extra"],
      ["all-X same length", "X".repeat(VALID_SVIX_SIGNATURE.length)],
      ["case variation", VALID_SVIX_SIGNATURE.toUpperCase()],
      ["leading whitespace", " " + VALID_SVIX_SIGNATURE],
      ["trailing whitespace", VALID_SVIX_SIGNATURE + " "],
      ["control char injected", VALID_SVIX_SIGNATURE + "\x00"],
    ];

    test.each(forgedSignatures)(
      "rejects forged signature: %s",
      async (_label, badSig) => {
        mockVerify.mockImplementation(() => {
          throw new Error("Invalid signature");
        });
        const res = await inject({
          headers: buildSvixHeaders({ "svix-signature": badSig }),
          payload: buildUserEvent("user.created", "u_forged"),
        });
        expect(res.statusCode).toBe(401);
        expect(createUserCalls).toBe(0);
      },
    );

    it("destructive `user.deleted` is rejected without svix headers", async () => {
      const res = await inject({
        payload: buildUserEvent("user.deleted", "u_target"),
      });
      expect(res.statusCode).toBe(401);
      expect(deleteUserCalls).toBe(0);
    });

    it("destructive `user.updated` is rejected without svix headers", async () => {
      const res = await inject({
        payload: buildUserEvent(
          "user.updated",
          "u_target",
          "attacker@evil.com",
        ),
      });
      expect(res.statusCode).toBe(401);
      expect(updateUserCalls).toBe(0);
    });
  });

  describe("payload malformation", () => {
    it("malformed JSON body returns 4xx, never 5xx, never invokes service", async () => {
      const res = await inject({
        headers: buildSvixHeaders(),
        rawPayload: "{not json",
      });
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.statusCode).toBeLessThan(500);
      expect(createUserCalls).toBe(0);
    });

    it("oversized payload (1MB) is processed or rejected, never 5xx", async () => {
      const huge = "X".repeat(1024 * 1024);
      const event = buildUserEvent("user.created", "u_huge") as {
        data: Record<string, unknown>;
      };
      event.data.junk = huge;
      const res = await inject({
        headers: buildSvixHeaders(),
        payload: event,
      });
      expect([200, 413, 400]).toContain(res.statusCode);
    });

    it("clerkId with special characters is passed through unchanged (Prisma layer handles escaping)", async () => {
      const evilId = "'; DROP TABLE users; --";
      const res = await inject({
        headers: buildSvixHeaders(),
        payload: buildUserEvent("user.created", evilId),
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
        buildSvixHeaders({ "svix-id": undefined }),
        buildSvixHeaders({ "svix-signature": undefined }),
        buildSvixHeaders({ "svix-timestamp": undefined }),
      ];
      const pickHeaders = (i: number): Record<string, string> =>
        variants[i % variants.length] ?? {};

      const responses = await Promise.all(
        Array.from({ length: N }, (_, i) =>
          inject({
            headers: pickHeaders(i),
            payload: buildUserEvent("user.created", `attacker_${i}`),
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
            headers: buildSvixHeaders(),
            payload: buildUserEvent("user.created", `valid_${i}`),
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
                ? buildSvixHeaders()
                : buildSvixHeaders({ "svix-signature": undefined }),
            payload: buildUserEvent("user.created", `mixed_${i}`),
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
    it("401 if CLERK_WEBHOOK_SECRET is unset at request time", async () => {
      const previous = process.env.CLERK_WEBHOOK_SECRET;
      delete process.env.CLERK_WEBHOOK_SECRET;
      const moduleRef = await Test.createTestingModule({
        controllers: [ClerkWebhooksController],
        providers: [{ provide: ClerkWebhooksService, useValue: mockService }],
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

      const res = await failApp
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: "POST",
          url: "/api/v1/webhooks/clerk",
          headers: {
            "content-type": "application/json",
            ...buildSvixHeaders(),
          },
          payload: JSON.stringify(buildUserEvent("user.created", "u")),
        });
      expect(res.statusCode).toBe(401);
      await failApp.close();
      if (previous) process.env.CLERK_WEBHOOK_SECRET = previous;
    });
  });
});
