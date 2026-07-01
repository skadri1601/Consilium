import { ConsoleLogger } from "@nestjs/common";
import * as Sentry from "@sentry/node";
import { SentryLogger } from "./sentry.logger";

jest.mock("@sentry/node", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

describe("SentryLogger", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(ConsoleLogger.prototype, "error")
      .mockImplementation(() => undefined);
    jest
      .spyOn(ConsoleLogger.prototype, "warn")
      .mockImplementation(() => undefined);
    jest
      .spyOn(ConsoleLogger.prototype, "fatal")
      .mockImplementation(() => undefined);
    process.env = { ...OLD_ENV, SENTRY_DSN: "https://key@o0.ingest.sentry.io/0" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("captures warnings as Sentry warning messages", () => {
    new SentryLogger().warn("disk almost full");
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "disk almost full",
      "warning",
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("captures Error objects via captureException", () => {
    const err = new Error("boom");
    new SentryLogger().error(err);
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it("captures string errors and preserves the stack", () => {
    new SentryLogger().error("db down", "at foo (bar.ts:1:1)");
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const captured = (Sentry.captureException as jest.Mock).mock.calls[0][0];
    expect(captured).toBeInstanceOf(Error);
    expect(captured.message).toBe("db down");
    expect(captured.stack).toBe("at foo (bar.ts:1:1)");
  });

  it("captures fatal logs via captureException", () => {
    new SentryLogger().fatal("process crashed");
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("does nothing to Sentry when SENTRY_DSN is unset", () => {
    delete process.env.SENTRY_DSN;
    const logger = new SentryLogger();
    logger.error(new Error("x"));
    logger.warn("y");
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
