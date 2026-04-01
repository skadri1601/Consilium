import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("DebatesController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/debates (POST) - should create a debate", () => {
    return request(app.getHttpServer())
      .post("/api/v1/debates")
      .set("Authorization", "Bearer test-token")
      .send({
        topic: "Test debate topic",
        models: ["gpt-4o-mini"],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty("id");
        expect(res.body.topic).toBe("Test debate topic");
      });
  });

  it("/debates (GET) - should return list of debates", () => {
    return request(app.getHttpServer())
      .get("/api/v1/debates")
      .set("Authorization", "Bearer test-token")
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
