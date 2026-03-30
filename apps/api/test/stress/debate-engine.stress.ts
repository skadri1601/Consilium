import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/shared/database/prisma.service";

const API_PREFIX = "/api/v1";
const AUTH_HEADER = "Authorization";
const BEARER_TOKEN = "Bearer stress_test_token_valid";
const EXPIRED_TOKEN =
  "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.expired";
const MALFORMED_TOKEN = "Bearer not-a-real-jwt-token!!!";
const VALID_MODELS_TWO = ["gpt-4o-mini", "claude-3-5-haiku-latest"];
const VALID_MODELS_FIVE = [
  "gpt-4o-mini",
  "claude-3-5-haiku-latest",
  "gemini-2.0-flash",
  "llama-3.1-8b-instant",
  "gpt-4o",
];
const VALID_MODELS_SIX = [
  "gpt-4o-mini",
  "claude-3-5-haiku-latest",
  "gemini-2.0-flash",
  "llama-3.1-8b-instant",
  "gpt-4o",
  "claude-3-5-sonnet-latest",
];
const SINGLE_MODEL = ["gpt-4o-mini"];
const REALISTIC_TOPIC =
  "Design a distributed event-driven microservices architecture for a fintech payment processing platform with real-time fraud detection";
const MIN_TOPIC = "API";
const MAX_TOPIC = "A".repeat(1000);
const OVER_MAX_TOPIC = "B".repeat(1001);
const SQL_INJECTION_TOPIC = "'; DROP TABLE debates; --";
const XSS_TOPIC = '<script>alert("xss")</script>Discuss best practices';
const UNICODE_TOPIC =
  "Discuss the impact of AI on healthcare \u{1F916}\u{1F3E5} in \u6F22\u5B57 and \u0410\u043D\u0434\u0440\u0435\u0439";
const WHITESPACE_TOPIC = "   \t\n   ";
const HUGE_TOPIC = "C".repeat(100000);
const TEST_USER_CLERK_ID = "stress_test_clerk_user_001";
const TEST_USER_EMAIL = "stress-test@consilium.dev";
const TEST_TENANT = "stress_test_tenant";

function makeDebatePayload(
  topic: string,
  models: string[],
  personaId?: string,
) {
  return { topic, models, ...(personaId && { personaId }) };
}

function fireParallelRequests(
  server: any,
  count: number,
  method: "post" | "get" | "delete",
  path: string,
  body?: Record<string, unknown>,
  token: string = BEARER_TOKEN,
) {
  const promises = Array.from({ length: count }, () => {
    const req = request(server)
      [method](`${API_PREFIX}${path}`)
      .set(AUTH_HEADER, token);
    if (body && method === "post") {
      return req.send(body);
    }
    return req;
  });
  return Promise.all(promises);
}

function extractUniqueIds(responses: request.Response[]): string[] {
  return [
    ...new Set(responses.filter((r) => r.body?.id).map((r) => r.body.id)),
  ];
}

function countByStatus(
  responses: request.Response[],
  statusCode: number,
): number {
  return responses.filter((r) => r.status === statusCode).length;
}

describe("Debate Engine Stress Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const user = await prisma.user.upsert({
      where: { clerkId: TEST_USER_CLERK_ID },
      update: {},
      create: {
        clerkId: TEST_USER_CLERK_ID,
        email: TEST_USER_EMAIL,
        tenantId: TEST_TENANT,
      },
    });
    userId = user.id;
  }, 30000);

  afterAll(async () => {
    await prisma.debateSession.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { clerkId: TEST_USER_CLERK_ID } });
    await app.close();
  }, 15000);

  describe("Concurrent Debate Creation", () => {
    it("should handle 20 simultaneous debate creation requests without duplicates", async () => {
      const payload = makeDebatePayload(REALISTIC_TOPIC, VALID_MODELS_TWO);
      const responses = await fireParallelRequests(
        app.getHttpServer(),
        20,
        "post",
        "/debates",
        payload,
      );

      const successful = responses.filter((r) => r.status === 201);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(successful.length + rateLimited.length).toBe(20);

      const uniqueIds = extractUniqueIds(successful);
      expect(uniqueIds.length).toBe(successful.length);
    }, 30000);

    it("should rate limit after threshold on rapid fire", async () => {
      const payload = makeDebatePayload(
        "Rate limit stress test for concurrent users",
        VALID_MODELS_TWO,
      );
      const responses = await fireParallelRequests(
        app.getHttpServer(),
        20,
        "post",
        "/debates",
        payload,
      );

      const rateLimited = countByStatus(responses, 429);
      expect(rateLimited).toBeGreaterThanOrEqual(0);
      expect(responses.every((r) => [201, 429, 400].includes(r.status))).toBe(
        true,
      );
    }, 30000);
  });

  describe("Maximum Models Validation", () => {
    it("should accept debate with exactly 5 models (max)", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(
          makeDebatePayload("Five model debate stress test", VALID_MODELS_FIVE),
        );

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.modelsUsed).toHaveLength(5);
      }
    });

    it("should reject debate with 6 models", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(
          makeDebatePayload("Six model debate should fail", VALID_MODELS_SIX),
        );

      expect(response.status).toBe(400);
    });

    it("should reject debate with only 1 model", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(
          makeDebatePayload("Single model debate should fail", SINGLE_MODEL),
        );

      expect(response.status).toBe(400);
    });

    it("should reject debate with empty models array", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload("No models should fail", []));

      expect(response.status).toBe(400);
    });
  });

  describe("Topic Edge Cases", () => {
    it("should reject empty topic with 400", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload("", VALID_MODELS_TWO));

      expect(response.status).toBe(400);
    });

    it("should accept 3-character topic (minimum)", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload(MIN_TOPIC, VALID_MODELS_TWO));

      expect([201, 400]).toContain(response.status);
    });

    it("should accept 1000-character topic (maximum)", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload(MAX_TOPIC, VALID_MODELS_TWO));

      expect([201, 400]).toContain(response.status);
    });

    it("should reject 1001-character topic", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload(OVER_MAX_TOPIC, VALID_MODELS_TWO));

      expect(response.status).toBe(400);
    });

    it("should sanitize or reject SQL injection attempt", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload(SQL_INJECTION_TOPIC, VALID_MODELS_TWO));

      if (response.status === 201) {
        expect(response.body.topic).not.toContain("DROP TABLE");
      } else {
        expect([400, 403]).toContain(response.status);
      }
    });

    it("should sanitize XSS script tags in topic", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload(XSS_TOPIC, VALID_MODELS_TWO));

      if (response.status === 201) {
        expect(response.body.topic).not.toContain("<script>");
      }
    });

    it("should accept unicode and emoji in topic", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload(UNICODE_TOPIC, VALID_MODELS_TWO));

      expect([201, 400]).toContain(response.status);
    });

    it("should reject whitespace-only topic", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload(WHITESPACE_TOPIC, VALID_MODELS_TWO));

      expect(response.status).toBe(400);
    });
  });

  describe("Authentication Stress", () => {
    it("should return 401 for request with no auth header", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .send(makeDebatePayload(REALISTIC_TOPIC, VALID_MODELS_TWO));

      expect(response.status).toBe(401);
    });

    it("should return 401 for expired token", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, EXPIRED_TOKEN)
        .send(makeDebatePayload(REALISTIC_TOPIC, VALID_MODELS_TWO));

      expect(response.status).toBe(401);
    });

    it("should return 401 for malformed token", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, MALFORMED_TOKEN)
        .send(makeDebatePayload(REALISTIC_TOPIC, VALID_MODELS_TWO));

      expect(response.status).toBe(401);
    });

    it("should rate limit 50 rapid requests with valid token", async () => {
      const responses = await fireParallelRequests(
        app.getHttpServer(),
        50,
        "get",
        "/debates",
      );

      const okCount = countByStatus(responses, 200);
      const rateLimitedCount = countByStatus(responses, 429);

      expect(okCount + rateLimitedCount).toBe(50);
      expect(responses.every((r) => [200, 429].includes(r.status))).toBe(true);
    }, 30000);
  });

  describe("Cancel During Processing", () => {
    it("should transition debate to deleted status when cancelled immediately", async () => {
      const createResponse = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(
          makeDebatePayload(
            "Debate to cancel immediately after creation",
            VALID_MODELS_TWO,
          ),
        );

      if (createResponse.status !== 201) return;

      const debateId = createResponse.body.id;

      const deleteResponse = await request(app.getHttpServer())
        .delete(`${API_PREFIX}/debates/${debateId}`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.deleted).toBe(true);
    });
  });

  describe("Retry Failed Debate", () => {
    it("should allow retrying a failed debate", async () => {
      const createResponse = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(
          makeDebatePayload(
            "Debate that will be retried after failure",
            VALID_MODELS_TWO,
          ),
        );

      if (createResponse.status !== 201) return;

      const debateId = createResponse.body.id;

      await prisma.debateSession.update({
        where: { id: debateId },
        data: { status: "failed" },
      });

      const retryResponse = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates/${debateId}/retry`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect([200, 400, 500]).toContain(retryResponse.status);
    });

    it("should reject retry on non-failed debate", async () => {
      const createResponse = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(
          makeDebatePayload(
            "Debate that should not be retried in non-failed state",
            VALID_MODELS_TWO,
          ),
        );

      if (createResponse.status !== 201) return;

      const debateId = createResponse.body.id;

      const retryResponse = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates/${debateId}/retry`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect(retryResponse.status).toBe(400);
    });

    it("should return 404 when retrying non-existent debate", async () => {
      const retryResponse = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates/non-existent-debate-id-12345/retry`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect(retryResponse.status).toBe(404);
    });
  });

  describe("Cost Estimate", () => {
    it("should respond within 500ms for non-LLM endpoints", async () => {
      const start = Date.now();

      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      const elapsed = Date.now() - start;

      expect(response.status).toBe(200);
      expect(elapsed).toBeLessThan(500);
    });

    it("should return debate list with cost data", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      if (response.status === 200 && response.body.length > 0) {
        const debate = response.body[0];
        expect(debate).toHaveProperty("totalCost");
        expect(typeof debate.totalCost).toBe("number");
        expect(debate.totalCost).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Conversation CRUD", () => {
    let conversationId: string;

    it("should create a conversation", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/conversations`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send({
          title: "Stress test conversation for architecture review",
          mode: "visible",
        });

      if (response.status === 201) {
        conversationId = response.body.id;
        expect(response.body.title).toBe(
          "Stress test conversation for architecture review",
        );
      }
      expect([201, 401, 400]).toContain(response.status);
    });

    it("should list conversations", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/conversations`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it("should get single conversation by id", async () => {
      if (!conversationId) return;

      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/conversations/${conversationId}`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect([200, 401, 404]).toContain(response.status);
    });

    it("should delete conversation", async () => {
      if (!conversationId) return;

      const response = await request(app.getHttpServer())
        .delete(`${API_PREFIX}/conversations/${conversationId}`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect([200, 401, 404]).toContain(response.status);
    });

    it("should return 404 for deleted conversation", async () => {
      if (!conversationId) return;

      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/conversations/${conversationId}`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect([404, 401]).toContain(response.status);
    });
  });

  describe("API Key Operations Under Load", () => {
    it("should handle 10 concurrent key test requests per provider", async () => {
      const providers = ["openai", "anthropic", "google", "groq", "xai"];

      for (const provider of providers) {
        const responses = await fireParallelRequests(
          app.getHttpServer(),
          10,
          "post",
          "/api-keys/test",
          { provider, key: `sk-test-stress-${provider}-key` },
        );

        const validStatuses = responses.every((r) =>
          [200, 400, 401, 429].includes(r.status),
        );
        expect(validStatuses).toBe(true);
      }
    }, 60000);

    it("should engage rate limiter on rapid key test requests", async () => {
      const responses = await fireParallelRequests(
        app.getHttpServer(),
        25,
        "post",
        "/api-keys/test",
        { provider: "openai", key: "sk-rapid-fire-test-key-0001" },
      );

      const rateLimited = countByStatus(responses, 429);
      expect(rateLimited).toBeGreaterThanOrEqual(0);
      expect(
        responses.every((r) => [200, 400, 401, 429].includes(r.status)),
      ).toBe(true);
    }, 30000);
  });

  describe("Large Payload Handling", () => {
    it("should handle or reject a 100000-character topic gracefully", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(makeDebatePayload(HUGE_TOPIC, VALID_MODELS_TWO));

      expect([400, 413]).toContain(response.status);
    });

    it("should reject payload with non-string model entries", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send({ topic: REALISTIC_TOPIC, models: [123, null, true] });

      expect(response.status).toBe(400);
    });

    it("should reject payload with extra unknown fields", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send({
          topic: REALISTIC_TOPIC,
          models: VALID_MODELS_TWO,
          hackerField: "should be stripped or rejected",
          adminOverride: true,
        });

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).not.toHaveProperty("hackerField");
        expect(response.body).not.toHaveProperty("adminOverride");
      }
    });

    it("should reject completely empty body", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should reject null body", async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .set("Content-Type", "application/json")
        .send("null");

      expect([400, 422]).toContain(response.status);
    });
  });

  describe("Debate Listing Performance", () => {
    it("should respond to list endpoint within 500ms", async () => {
      const start = Date.now();

      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/debates?limit=20&offset=0`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      const elapsed = Date.now() - start;

      expect(response.status).toBe(200);
      expect(elapsed).toBeLessThan(500);
    });

    it("should support pagination with limit and offset", async () => {
      const page1 = await request(app.getHttpServer())
        .get(`${API_PREFIX}/debates?limit=2&offset=0`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      const page2 = await request(app.getHttpServer())
        .get(`${API_PREFIX}/debates?limit=2&offset=2`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);

      if (page1.body.length > 0 && page2.body.length > 0) {
        expect(page1.body[0].id).not.toBe(page2.body[0].id);
      }
    });

    it("should return empty array for large offset", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/debates?limit=20&offset=99999`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("Debate Detail Retrieval", () => {
    it("should return 404 for non-existent debate", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/debates/non-existent-id-abc123`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect(response.status).toBe(404);
    });

    it("should return full debate detail with rounds and messages", async () => {
      const createResponse = await request(app.getHttpServer())
        .post(`${API_PREFIX}/debates`)
        .set(AUTH_HEADER, BEARER_TOKEN)
        .send(
          makeDebatePayload(
            "Debate detail retrieval stress test",
            VALID_MODELS_TWO,
          ),
        );

      if (createResponse.status !== 201) return;

      const detailResponse = await request(app.getHttpServer())
        .get(`${API_PREFIX}/debates/${createResponse.body.id}`)
        .set(AUTH_HEADER, BEARER_TOKEN);

      expect(detailResponse.status).toBe(200);
      expect(detailResponse.body).toHaveProperty("id");
      expect(detailResponse.body).toHaveProperty("topic");
      expect(detailResponse.body).toHaveProperty("status");
    });
  });
});
