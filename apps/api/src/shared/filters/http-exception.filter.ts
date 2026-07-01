import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ConsoleLogger,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import * as Sentry from "@sentry/node";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new ConsoleLogger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const detail =
      exception instanceof Error ? exception.message : "Unknown error";

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `HTTP ${status} Error: ${detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`HTTP ${status} Error: ${detail}`);
    }

    this.reportToSentry(exception, request, status);

    const clientMessage = this.getSafeMessage(exception, status);

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: clientMessage,
    });
  }

  private reportToSentry(
    exception: unknown,
    request: FastifyRequest,
    status: number,
  ): void {
    if (!process.env.SENTRY_DSN) {
      return;
    }
    Sentry.withScope((scope) => {
      scope.setLevel(
        status >= HttpStatus.INTERNAL_SERVER_ERROR ? "error" : "warning",
      );
      scope.setTag("http.status", String(status));
      scope.setTag("http.method", request.method);
      scope.setContext("request", {
        method: request.method,
        url: request.url,
      });
      Sentry.captureException(
        exception instanceof Error
          ? exception
          : new Error(`HTTP ${status}: ${String(exception)}`),
      );
    });
  }

  private getSafeMessage(
    exception: unknown,
    status: number,
  ): string | string[] {
    if (!(exception instanceof HttpException)) {
      return "Internal server error";
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === "string") {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      if (Array.isArray(resp.message)) {
        return resp.message as string[];
      }
      if (typeof resp.message === "string") {
        if (
          resp.message.includes("Prisma") ||
          resp.message.includes("prisma")
        ) {
          return "Internal server error";
        }
        return resp.message;
      }
    }

    return HttpStatus[status] || "Internal server error";
  }
}
