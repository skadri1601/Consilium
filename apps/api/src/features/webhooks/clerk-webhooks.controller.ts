import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { RateLimit } from "../../shared/decorators/rate-limit.decorator";

interface ClerkUserWebhookPayload {
  action: "create" | "update" | "delete";
  clerkId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

interface SessionEndedPayload {
  userId: string;
  sessionId: string;
}

@Controller("api/v1/webhooks/clerk")
@UseGuards(RateLimitGuard)
@RateLimit(50, 60)
export class ClerkWebhooksController {
  private readonly logger = new Logger(ClerkWebhooksController.name);

  constructor(private readonly webhooksService: ClerkWebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleUserWebhook(
    @Headers("x-webhook-secret") secret: string,
    @Body() payload: ClerkUserWebhookPayload,
  ) {
    this.verifyWebhookSecret(secret);

    this.logger.log(`Processing Clerk user webhook: ${payload.action} for ${payload.clerkId}`);

    switch (payload.action) {
      case "create":
        return this.webhooksService.createUser(payload);
      case "update":
        return this.webhooksService.updateUser(payload);
      case "delete":
        return this.webhooksService.deleteUser(payload.clerkId);
      default:
        this.logger.warn(`Unknown action: ${payload.action}`);
        return { received: true };
    }
  }

  @Post("session-ended")
  @HttpCode(HttpStatus.OK)
  async handleSessionEnded(
    @Headers("x-webhook-secret") secret: string,
    @Body() payload: SessionEndedPayload,
  ) {
    this.verifyWebhookSecret(secret);

    this.logger.log(`Processing session ended for user: ${payload.userId}`);

    return this.webhooksService.handleSessionEnded(payload.userId, payload.sessionId);
  }

  private verifyWebhookSecret(secret: string): void {
    const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET;

    if (!expectedSecret) {
      this.logger.warn("INTERNAL_WEBHOOK_SECRET not configured");
      return; // Allow in development
    }

    if (secret !== expectedSecret) {
      throw new UnauthorizedException("Invalid webhook secret");
    }
  }
}

