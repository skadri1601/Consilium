import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";

@Injectable()
export class WebhookSecretGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(WebhookSecretGuard.name);
  private expectedSecretBuffer: Buffer | null = null;

  onModuleInit(): void {
    const expected = process.env.INTERNAL_WEBHOOK_SECRET;
    if (!expected || expected.length < 16) {
      this.logger.error(
        "INTERNAL_WEBHOOK_SECRET is missing or too short. Webhook endpoint will reject all requests.",
      );
      this.expectedSecretBuffer = null;
      return;
    }
    this.expectedSecretBuffer = Buffer.from(expected, "utf8");
    this.logger.log(
      `Webhook secret loaded (${this.expectedSecretBuffer.length} bytes).`,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.expectedSecretBuffer) {
      throw new ServiceUnavailableException(
        "Webhook endpoint not configured. Set INTERNAL_WEBHOOK_SECRET.",
      );
    }

    const request = context.switchToHttp().getRequest();
    const headers = (request.headers ?? {}) as Record<string, unknown>;
    const provided = headers["x-webhook-secret"];

    if (typeof provided !== "string" || provided.length === 0) {
      throw new UnauthorizedException("Missing webhook secret");
    }

    const providedBuffer = Buffer.from(provided, "utf8");
    if (
      providedBuffer.length !== this.expectedSecretBuffer.length ||
      !timingSafeEqual(providedBuffer, this.expectedSecretBuffer)
    ) {
      throw new UnauthorizedException("Invalid webhook secret");
    }

    return true;
  }
}
