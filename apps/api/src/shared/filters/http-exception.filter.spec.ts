import { ArgumentsHost, ConsoleLogger, HttpException, HttpStatus } from "@nestjs/common";
import * as Sentry from "@sentry/node";
import { HttpExceptionFilter } from "./http-exception.filter";

jest.mock("@sentry/node", () => ({
  captureException: jest.fn(),
  withScope: jest.fn((cb) =>
    cb({ setLevel: jest.fn(), setTag: jest.fn(), setContext: jest.fn() }),
  ),
}));

function makeHost(): { host: ArgumentsHost; sent: { body?: Record<string, unknown> } } {
  const sent: { body?: Record<string, unknown> } = {};
  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn((body: Record<string, unknown>) => {
      sent.body = body;
    }),
  };
  const request = { url: "/api/v1/debates", method: "POST" };
  const host = {
    switchToHttp: () => ({
      getResponse: () => reply,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, sent };
}

describe("HttpExceptionFilter", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, SENTRY_DSN: "https://key@o0.ingest.sentry.io/0" };
    jest
      .spyOn(ConsoleLogger.prototype, "error")
      .mockImplementation(() => undefined);
    jest
      .spyOn(ConsoleLogger.prototype, "warn")
      .mockImplementation(() => undefined);
  });

  afterAll(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("captures 5xx / unhandled errors to Sentry", () => {
    const { host, sent } = makeHost();
    new HttpExceptionFilter().catch(new Error("db down"), host);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(sent.body?.statusCode).toBe(500);
    expect(sent.body?.message).toBe("Internal server error");
  });

  it("also captures 4xx client errors to Sentry", () => {
    const { host, sent } = makeHost();
    new HttpExceptionFilter().catch(
      new HttpException("bad input", HttpStatus.BAD_REQUEST),
      host,
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(sent.body?.statusCode).toBe(400);
  });

  it("does not call Sentry when SENTRY_DSN is unset", () => {
    delete process.env.SENTRY_DSN;
    const { host } = makeHost();
    new HttpExceptionFilter().catch(
      new HttpException("bad", HttpStatus.BAD_REQUEST),
      host,
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
