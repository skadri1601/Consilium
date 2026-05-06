import {
  ServiceUnavailableException,
  UnauthorizedException,
  ExecutionContext,
} from "@nestjs/common";
import { WebhookSecretGuard } from "./webhook-secret.guard";

function makeContext(headers: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
      getResponse: () => ({}),
      getNext: () => () => undefined,
    }),
    getClass: () => ({}) as never,
    getHandler: () => ({}) as never,
    getArgs: () => [] as never,
    getArgByIndex: () => undefined as never,
    switchToRpc: () => ({}) as never,
    switchToWs: () => ({}) as never,
    getType: () => "http",
  } as unknown as ExecutionContext;
}

describe("WebhookSecretGuard", () => {
  const validSecret = "test_secret_at_least_sixteen_chars_long_xyz";
  let guard: WebhookSecretGuard;

  beforeEach(() => {
    delete process.env.INTERNAL_WEBHOOK_SECRET;
    guard = new WebhookSecretGuard();
  });

  afterEach(() => {
    delete process.env.INTERNAL_WEBHOOK_SECRET;
  });

  describe("onModuleInit", () => {
    it("rejects all requests when env is missing", () => {
      guard.onModuleInit();
      expect(() =>
        guard.canActivate(makeContext({ "x-webhook-secret": validSecret })),
      ).toThrow(ServiceUnavailableException);
    });

    it("rejects all requests when env is shorter than 16 chars", () => {
      process.env.INTERNAL_WEBHOOK_SECRET = "tooshort";
      guard.onModuleInit();
      expect(() =>
        guard.canActivate(makeContext({ "x-webhook-secret": "tooshort" })),
      ).toThrow(ServiceUnavailableException);
    });

    it("loads the secret successfully when env is set and >= 16 chars", () => {
      process.env.INTERNAL_WEBHOOK_SECRET = validSecret;
      guard.onModuleInit();
      expect(
        guard.canActivate(makeContext({ "x-webhook-secret": validSecret })),
      ).toBe(true);
    });
  });

  describe("canActivate (with env set)", () => {
    beforeEach(() => {
      process.env.INTERNAL_WEBHOOK_SECRET = validSecret;
      guard.onModuleInit();
    });

    it("rejects when header is missing entirely", () => {
      expect(() => guard.canActivate(makeContext({}))).toThrow(
        UnauthorizedException,
      );
    });

    it("rejects when header is empty string", () => {
      expect(() =>
        guard.canActivate(makeContext({ "x-webhook-secret": "" })),
      ).toThrow(UnauthorizedException);
    });

    it("rejects when header is undefined", () => {
      expect(() =>
        guard.canActivate(makeContext({ "x-webhook-secret": undefined })),
      ).toThrow(UnauthorizedException);
    });

    it("rejects when header is a non-string (number)", () => {
      expect(() =>
        guard.canActivate(makeContext({ "x-webhook-secret": 123 })),
      ).toThrow(UnauthorizedException);
    });

    it("rejects when header value is shorter than expected secret", () => {
      expect(() =>
        guard.canActivate(makeContext({ "x-webhook-secret": "short" })),
      ).toThrow(UnauthorizedException);
    });

    it("rejects when header value is longer than expected secret", () => {
      expect(() =>
        guard.canActivate(
          makeContext({ "x-webhook-secret": validSecret + "extra" }),
        ),
      ).toThrow(UnauthorizedException);
    });

    it("rejects when header value differs in one character", () => {
      const tampered = validSecret.slice(0, -1) + "X";
      expect(() =>
        guard.canActivate(makeContext({ "x-webhook-secret": tampered })),
      ).toThrow(UnauthorizedException);
    });

    it("rejects an exact-length but completely different value", () => {
      const same_length_diff = "X".repeat(validSecret.length);
      expect(() =>
        guard.canActivate(
          makeContext({ "x-webhook-secret": same_length_diff }),
        ),
      ).toThrow(UnauthorizedException);
    });

    it("accepts the exact secret", () => {
      expect(
        guard.canActivate(makeContext({ "x-webhook-secret": validSecret })),
      ).toBe(true);
    });

    it("uses constant-time comparison (1k attempts complete quickly)", () => {
      const wrong = "X".repeat(validSecret.length);
      const start = Date.now();
      let rejected = 0;
      for (let i = 0; i < 1000; i++) {
        try {
          guard.canActivate(makeContext({ "x-webhook-secret": wrong }));
        } catch {
          rejected++;
        }
      }
      expect(rejected).toBe(1000);
      expect(Date.now() - start).toBeLessThan(2000);
    });
  });
});
