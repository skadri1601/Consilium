import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { RateLimit } from "../../shared/decorators/rate-limit.decorator";
import { WebhookSecretGuard } from "./guards/webhook-secret.guard";

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

@Controller("webhooks/clerk")
@UseGuards(WebhookSecretGuard, RateLimitGuard)
@RateLimit(50, 60)
export class ClerkWebhooksController {
  private readonly logger = new Logger(ClerkWebhooksController.name);

  constructor(private readonly webhooksService: ClerkWebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleUserWebhook(@Body() payload: ClerkUserWebhookPayload) {
    this.logger.log(
      `Processing Clerk user webhook: ${payload.action} for ${payload.clerkId}`,
    );

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
  async handleSessionEnded(@Body() payload: SessionEndedPayload) {
    this.logger.log(`Processing session ended for user: ${payload.userId}`);

    return this.webhooksService.handleSessionEnded(
      payload.userId,
      payload.sessionId,
    );
  }
}
