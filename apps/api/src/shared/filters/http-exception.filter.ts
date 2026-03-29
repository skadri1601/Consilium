import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      `HTTP ${status} Error: ${exception instanceof Error ? exception.message : "Unknown error"}`,
      exception instanceof Error ? exception.stack : undefined
    );

    const clientMessage = this.getSafeMessage(exception, status);

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: clientMessage,
    });
  }

  private getSafeMessage(exception: unknown, status: number): string | string[] {
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
        if (resp.message.includes("Prisma") || resp.message.includes("prisma")) {
          return "Internal server error";
        }
        return resp.message;
      }
    }

    return HttpStatus[status] || "Internal server error";
  }
}
