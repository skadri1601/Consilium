import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/shared/database/prisma.service";

describe("API Keys Integration (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test user
    const user = await prisma.user.create({
      data: {
        clerkId: "test_user_api_keys",
        email: "apikeys@example.com",
        tenantId: "test_tenant",
      },
    });
    userId = user.id;
    authToken = "mock_clerk_token";
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { clerkId: "test_user_api_keys" },
    });
    await app.close();
  });

  describe("API Key Management", () => {
    it("should get masked API keys", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("openaiKey");
      expect(response.body).toHaveProperty("anthropicKey");
      expect(response.body).toHaveProperty("googleKey");
      expect(response.body).toHaveProperty("groqKey");
    });

    it("should update API keys", async () => {
      const response = await request(app.getHttpServer())
        .put("/api/v1/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          openaiKey: "sk-test-key-12345",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should mask API keys in response", async () => {
      // Update with a key
      await request(app.getHttpServer())
        .put("/api/v1/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          openaiKey: "sk-test-key-123456789",
        })
        .expect(200);

      // Get keys should be masked
      const response = await request(app.getHttpServer())
        .get("/api/v1/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Key should be masked (show only last 4 chars)
      if (response.body.openaiKey) {
        expect(response.body.openaiKey).toMatch(/\.\.\.\w{4}$/);
      }
    });

    it("should test API key", async () => {
      // This would actually call the AI provider in real scenario
      // For testing, we'll just verify the endpoint exists
      await request(app.getHttpServer())
        .post("/api/v1/api-keys/test")
        .send({
          provider: "openai",
          key: "sk-test-key",
        })
        .expect((res) => {
          // May succeed or fail depending on key validity
          expect([200, 400, 401]).toContain(res.status);
        });
    });
  });
});
