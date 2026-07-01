import { ConfigService } from "@nestjs/config";
import { AiWorkersClient } from "./ai-workers.client";

function makeClient(key?: string): AiWorkersClient {
  const config = {
    get: (k: string) => (k === "CONSILIUM_API_KEY" ? key : undefined),
  } as unknown as ConfigService;
  return new AiWorkersClient(config);
}

describe("AiWorkersClient.getAuthHeaders", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.CONSILIUM_API_KEY;
    delete process.env.AI_WORKERS_URL;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("sends a Bearer header when CONSILIUM_API_KEY is configured", () => {
    expect(makeClient("secret123").getAuthHeaders()).toEqual({
      Authorization: "Bearer secret123",
    });
  });

  it("falls back to process.env.CONSILIUM_API_KEY", () => {
    process.env.CONSILIUM_API_KEY = "from-env";
    expect(makeClient(undefined).getAuthHeaders()).toEqual({
      Authorization: "Bearer from-env",
    });
  });

  it("sends no auth header when the key is absent", () => {
    expect(makeClient(undefined).getAuthHeaders()).toEqual({});
  });
});
