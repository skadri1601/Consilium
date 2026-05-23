import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import {
  OptionalClerkAuthGuard,
  SessionSharesController,
  SharesController,
} from "./shares.controller";
import { SharesService } from "./shares.service";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { PrismaService } from "../../shared/database/prisma.service";

type StoredShare = {
  id: string;
  token: string;
  sessionId: string;
  userId: string;
  isPublic: boolean;
  expiresAt: Date | null;
  payload: unknown;
  views: number;
  createdAt: Date;
  updatedAt: Date;
};

function makePrismaMock() {
  const store = new Map<string, StoredShare>();
  let counter = 0;
  const prisma = {
    sessionShare: {
      create: jest.fn(async ({ data }: { data: any }) => {
        counter += 1;
        const record: StoredShare = {
          id: `share_${counter}`,
          token: data.token,
          sessionId: data.sessionId,
          userId: data.userId,
          isPublic: !!data.isPublic,
          expiresAt: data.expiresAt ?? null,
          payload: data.payload ?? {},
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.set(record.id, record);
        return record;
      }),
      findUnique: jest.fn(
        async ({ where }: { where: { id?: string; token?: string } }) => {
          if (where.id) return store.get(where.id) ?? null;
          if (where.token) {
            for (const r of store.values()) {
              if (r.token === where.token) return r;
            }
          }
          return null;
        },
      ),
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { views?: { increment: number } };
        }) => {
          const r = store.get(where.id);
          if (!r) throw new Error("not found");
          if (data.views?.increment) r.views += data.views.increment;
          r.updatedAt = new Date();
          return r;
        },
      ),
      delete: jest.fn(async ({ where }: { where: { id: string } }) => {
        const r = store.get(where.id);
        store.delete(where.id);
        return r;
      }),
    },
    __store: store,
  };
  return prisma;
}

describe("SharesController", () => {
  let app: NestFastifyApplication;
  let prismaMock: ReturnType<typeof makePrismaMock>;
  let currentUserId: string | undefined;

  beforeAll(async () => {
    process.env.WEB_BASE_URL = "https://share.test";
    prismaMock = makePrismaMock();
    currentUserId = "user_owner";

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true })],
      controllers: [SessionSharesController, SharesController],
      providers: [
        SharesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          if (!currentUserId) return false;
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: currentUserId };
          return true;
        },
      })
      .overrideGuard(OptionalClerkAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          const auth = req.headers?.authorization as string | undefined;
          if (auth?.startsWith("Bearer ")) {
            const tokenUser = auth.slice("Bearer ".length);
            req.user = { userId: tokenUser };
          }
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix("api/v1");
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    delete process.env.WEB_BASE_URL;
    await app.close();
  });

  beforeEach(() => {
    prismaMock.__store.clear();
    currentUserId = "user_owner";
  });

  async function inject(opts: {
    method: "POST" | "GET" | "DELETE";
    url: string;
    payload?: unknown;
    authAs?: string;
  }): Promise<{ statusCode: number; body: any }> {
    const hasPayload = opts.payload !== undefined;
    const headers: Record<string, string> = {};
    if (hasPayload) headers["content-type"] = "application/json";
    if (opts.authAs) headers.authorization = `Bearer ${opts.authAs}`;
    const res = await app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: opts.method,
        url: opts.url,
        headers,
        payload: hasPayload ? JSON.stringify(opts.payload) : undefined,
      });
    let body: any;
    try {
      body = JSON.parse(res.body);
    } catch {
      body = res.body;
    }
    return { statusCode: res.statusCode, body };
  }

  describe("POST /sessions/:id/share", () => {
    it("returns 201 with token and url on success", async () => {
      const res = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_1/share",
        payload: { public: false, payload: { id: "ses_1", debates: [] } },
      });
      expect(res.statusCode).toBe(201);
      expect(typeof res.body.token).toBe("string");
      expect(res.body.token.length).toBeGreaterThan(10);
      expect(res.body.url).toBe(`https://share.test/share/${res.body.token}`);
      expect(res.body.id).toBeTruthy();
      expect(res.body.public).toBe(false);
    });

    it("returns 201 with public=true when requested", async () => {
      const res = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_pub/share",
        payload: { public: true, payload: { id: "ses_pub" } },
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.public).toBe(true);
    });

    it("sets expiresAt when expiresIn provided", async () => {
      const res = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_exp/share",
        payload: { expiresIn: 24, payload: { id: "ses_exp" } },
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.expiresAt).toBeTruthy();
    });

    it("returns 401 when not authenticated", async () => {
      currentUserId = undefined;
      const res = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_anon/share",
        payload: { payload: {} },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /shares/:token", () => {
    it("returns share for public token without auth and increments views", async () => {
      currentUserId = "user_owner";
      const create = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_pub2/share",
        payload: { public: true, payload: { hello: "world" } },
      });
      expect(create.statusCode).toBe(201);

      currentUserId = undefined;
      const get1 = await inject({
        method: "GET",
        url: `/api/v1/shares/${create.body.token}`,
      });
      expect(get1.statusCode).toBe(200);
      expect(get1.body.payload).toEqual({ hello: "world" });
      expect(get1.body.views).toBe(1);

      const get2 = await inject({
        method: "GET",
        url: `/api/v1/shares/${create.body.token}`,
      });
      expect(get2.body.views).toBe(2);
    });

    it("returns 401 on private share with no auth", async () => {
      currentUserId = "user_owner";
      const create = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_priv/share",
        payload: { public: false, payload: { secret: true } },
      });

      currentUserId = undefined;
      const res = await inject({
        method: "GET",
        url: `/api/v1/shares/${create.body.token}`,
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns 403 on private share with wrong user", async () => {
      currentUserId = "user_owner";
      const create = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_priv2/share",
        payload: { public: false, payload: {} },
      });

      const res = await inject({
        method: "GET",
        url: `/api/v1/shares/${create.body.token}`,
        authAs: "user_intruder",
      });
      expect(res.statusCode).toBe(403);
    });

    it("returns share for owner on private share", async () => {
      currentUserId = "user_owner";
      const create = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_owner/share",
        payload: { public: false, payload: { secret: "value" } },
      });

      const res = await inject({
        method: "GET",
        url: `/api/v1/shares/${create.body.token}`,
        authAs: "user_owner",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.payload).toEqual({ secret: "value" });
    });

    it("returns 404 on unknown token", async () => {
      const res = await inject({
        method: "GET",
        url: "/api/v1/shares/does-not-exist",
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe("DELETE /sessions/:id/share/:shareId", () => {
    it("deletes when called by owner", async () => {
      currentUserId = "user_owner";
      const create = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_del/share",
        payload: { public: true, payload: {} },
      });

      const res = await inject({
        method: "DELETE",
        url: `/api/v1/sessions/ses_del/share/${create.body.id}`,
      });
      expect(res.statusCode).toBe(200);
      expect(prismaMock.__store.size).toBe(0);
    });

    it("returns 403 when called by non-owner", async () => {
      currentUserId = "user_owner";
      const create = await inject({
        method: "POST",
        url: "/api/v1/sessions/ses_del2/share",
        payload: { public: true, payload: {} },
      });

      currentUserId = "user_intruder";
      const res = await inject({
        method: "DELETE",
        url: `/api/v1/sessions/ses_del2/share/${create.body.id}`,
      });
      expect(res.statusCode).toBe(403);
      expect(prismaMock.__store.size).toBe(1);
    });
  });
});
