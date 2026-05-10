import { Module } from "@nestjs/common";
import { ClerkWebhooksController } from "./clerk-webhooks.controller";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { WebhookSecretGuard } from "./guards/webhook-secret.guard";
import { PrismaModule } from "../../shared/database";
import { AuditLoggerService } from "../../shared/services/audit-logger.service";
import { EmailService } from "../../shared/services/email.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { AuthModule } from "../auth";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ClerkWebhooksController],
  providers: [
    ClerkWebhooksService,
    AuditLoggerService,
    EmailService,
    RateLimitGuard,
    WebhookSecretGuard,
  ],
  exports: [ClerkWebhooksService],
})
export class WebhooksModule {}
