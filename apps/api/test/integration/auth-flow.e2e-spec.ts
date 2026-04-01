import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/shared/database/prisma.service";

describe("Authentication Flow Integration (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Protected Routes", () => {
    it("should require authentication for debates endpoint", async () => {
      await request(app.getHttpServer()).get("/api/v1/debates").expect(401);
    });

    it("should require authentication for user endpoint", async () => {
      await request(app.getHttpServer()).get("/api/v1/users/me").expect(401);
    });

    it("should require authentication for API keys endpoint", async () => {
      await request(app.getHttpServer()).get("/api/v1/api-keys").expect(401);
    });
  });

  describe("Public Routes", () => {
    it("should allow access to health endpoint", async () => {
      await request(app.getHttpServer()).get("/api/v1/health").expect(200);
    });

    it("should allow access to waitlist endpoint", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/waitlist")
        .send({
          email: "test@example.com",
        })
        .expect(201);
    });
  });

  describe("Waitlist", () => {
    it("should create waitlist entry", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/waitlist")
        .send({
          email: "newuser@example.com",
          source: "test",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("should reject duplicate email", async () => {
      const email = "duplicate@example.com";

      // First entry
      await request(app.getHttpServer())
        .post("/api/v1/waitlist")
        .send({ email })
        .expect(201);

      // Duplicate entry
      await request(app.getHttpServer())
        .post("/api/v1/waitlist")
        .send({ email })
        .expect(409);
    });

    it("should validate email format", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/waitlist")
        .send({
          email: "invalid-email",
        })
        .expect(400);
    });
  });
});
