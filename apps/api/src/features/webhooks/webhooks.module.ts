import { Module } from "@nestjs/common";
import { ClerkWebhooksController } from "./clerk-webhooks.controller";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { PrismaModule } from "../../shared/database";
import { AuditLoggerService } from "../../shared/services/audit-logger.service";
import { SessionService } from "../../shared/services/session.service";
import { EmailService } from "../../shared/services/email.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";

@Module({
  imports: [PrismaModule],
  controllers: [ClerkWebhooksController],
  providers: [ClerkWebhooksService, AuditLoggerService, SessionService, EmailService, RateLimitGuard],
  exports: [ClerkWebhooksService],
})
export class WebhooksModule {}

