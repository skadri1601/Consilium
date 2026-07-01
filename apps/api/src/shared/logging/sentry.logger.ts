import { ConsoleLogger } from "@nestjs/common";
import * as Sentry from "@sentry/node";

export class SentryLogger extends ConsoleLogger {
  error(message: any, ...optionalParams: any[]): void {
    super.error(message, ...optionalParams);
    this.reportError(message, optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]): void {
    super.fatal(message, ...optionalParams);
    this.reportError(message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): void {
    super.warn(message, ...optionalParams);
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(this.toText(message), "warning");
    }
  }

  private reportError(message: any, optionalParams: any[]): void {
    if (!process.env.SENTRY_DSN) {
      return;
    }
    if (message instanceof Error) {
      Sentry.captureException(message);
      return;
    }
    const stack =
      typeof optionalParams[0] === "string" ? optionalParams[0] : undefined;
    const error = new Error(this.toText(message));
    if (stack) {
      error.stack = stack;
    }
    Sentry.captureException(error);
  }

  private toText(message: any): string {
    if (typeof message === "string") {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
