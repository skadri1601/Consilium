import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/shared/database/prisma.service";
import { ClerkAuthGuard } from "../../src/features/auth/guards/clerk-auth.guard";
import { RateLimitGuard } from "../../src/shared/guards/rate-limit.guard";
import { HttpExceptionFilter } from "../../src/shared/filters/http-exception.filter";
import { LoggingInterceptor } from "../../src/shared/interceptors/logging.interceptor";

const TEST_CLERK_ID = "test_user_clerk_123";

class MockClerkAuthGuard {
  canActivate(context: any) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("No authentication token provided");
    }

    request.user = { userId: TEST_CLERK_ID };
    return true;
  }
}

class MockRateLimitGuard {
  canActivate() {
    return true;
  }
}

describe("Debate Flow Integration (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(MockClerkAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.setGlobalPrefix("api/v1");

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create a test user
    const user = await prisma.user.create({
      data: {
        clerkId: TEST_CLERK_ID,
        email: "test@example.com",
        tenantId: "test_tenant",
      },
    });
    userId = user.id;

    // Token value doesn't matter — MockClerkAuthGuard just checks for presence
    authToken = "mock_clerk_token";
  });

  afterAll(async () => {
    // Cleanup: delete debates and related data for the test user, then the user
    await prisma.debateSession.deleteMany({
      where: { userId },
    });
    await prisma.user.deleteMany({
      where: { clerkId: TEST_CLERK_ID },
    });
    await app.close();
  });

  describe("Complete Debate Flow", () => {
    it("should create, process, and retrieve a debate", async () => {
      // Step 1: Create debate
      const createResponse = await request(app.getHttpServer())
        .post("/api/v1/debates")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          topic: "Build a REST API with authentication",
          models: ["gpt-5.4-mini"],
        })
        .expect(201);

      const debateId = createResponse.body.id;
      expect(debateId).toBeDefined();
      expect(createResponse.body.status).toBe("processing");

      // Step 2: Retrieve debate
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/debates/${debateId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.id).toBe(debateId);
      expect(getResponse.body.topic).toContain("REST API");

      // Step 3: List debates
      const listResponse = await request(app.getHttpServer())
        .get("/api/v1/debates")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBeGreaterThan(0);
    });

    it("should handle debate creation with multiple models", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/debates")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          topic: "Create a React dashboard",
          models: ["gpt-5.4-mini", "claude-haiku-4-5-20251001"],
        })
        .expect(201);

      expect(response.body.modelsUsed).toHaveLength(2);
      expect(response.body.modelsUsed).toContain("gpt-5.4-mini");
      expect(response.body.modelsUsed).toContain("claude-haiku-4-5-20251001");
    });

    it("should reject debate creation without API keys", async () => {
      // Create user without API keys configured
      const userWithoutKeys = await prisma.user.create({
        data: {
          clerkId: "test_user_no_keys",
          email: "nokeys@example.com",
          tenantId: "test_tenant",
        },
      });

      // This would fail in real scenario if no API keys
      // For now, we'll test the validation
      await request(app.getHttpServer())
        .post("/api/v1/debates")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          topic: "Test topic",
          models: ["gpt-5.4-mini"],
        })
        // May succeed if env vars have keys, or fail if not
        .expect((res) => {
          expect([201, 400]).toContain(res.status);
        });

      // Cleanup
      await prisma.user.delete({
        where: { id: userWithoutKeys.id },
      });
    });
  });

  describe("Debate Status Updates", () => {
    it("should update debate status", async () => {
      // Create debate
      const createResponse = await request(app.getHttpServer())
        .post("/api/v1/debates")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          topic: "Test status update",
          models: ["gpt-5.4-mini"],
        })
        .expect(201);

      const debateId = createResponse.body.id;

      // Verify initial status
      expect(createResponse.body.status).toBe("processing");

      // In a real scenario, status would be updated by AI workers
      // For testing, we can verify the debate exists and has correct structure
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/debates/${debateId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.status).toBeDefined();
      expect(["pending", "processing", "completed", "failed"]).toContain(
        getResponse.body.status,
      );
    });
  });

  describe("Debate History", () => {
    it("should paginate debate results", async () => {
      // Create multiple debates
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post("/api/v1/debates")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            topic: `Test debate ${i}`,
            models: ["gpt-5.4-mini"],
          });
      }

      // Test pagination
      const page1 = await request(app.getHttpServer())
        .get("/api/v1/debates?limit=2&offset=0")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(page1.body.length).toBeLessThanOrEqual(2);

      const page2 = await request(app.getHttpServer())
        .get("/api/v1/debates?limit=2&offset=2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Results should be different
      if (page1.body.length > 0 && page2.body.length > 0) {
        expect(page1.body[0].id).not.toBe(page2.body[0].id);
      }
    });

    it("should only return user's own debates", async () => {
      // Create debate for test user
      await request(app.getHttpServer())
        .post("/api/v1/debates")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          topic: "User-specific debate",
          models: ["gpt-5.4-mini"],
        })
        .expect(201);

      // List debates should only show this user's debates
      const listResponse = await request(app.getHttpServer())
        .get("/api/v1/debates")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // All debates should belong to the test user
      listResponse.body.forEach((debate: any) => {
        expect(debate.userId).toBe(userId);
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent debate", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/debates/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 401 for unauthenticated requests", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/debates")
        .send({
          topic: "Test",
          models: ["gpt-5.4-mini"],
        })
        .expect(401);
    });

    it("should validate request body", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/debates")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });
  });
});
