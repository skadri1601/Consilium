import { Module } from "@nestjs/common";
import { ClerkWebhooksController } from "./clerk-webhooks.controller";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { SentryWebhooksController } from "./sentry-webhooks.controller";
import { SentryWebhooksService } from "./sentry-webhooks.service";
import { SonarqubeWebhooksController } from "./sonarqube-webhooks.controller";
import { SonarqubeWebhooksService } from "./sonarqube-webhooks.service";
import { LinearTicketService } from "./linear-ticket.service";
import { WebhookSecretGuard } from "./guards/webhook-secret.guard";
import { PrismaModule } from "../../shared/database";
import { AuditLoggerService } from "../../shared/services/audit-logger.service";
import { SessionService } from "../../shared/services/session.service";
import { EmailService } from "../../shared/services/email.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";

@Module({
  imports: [PrismaModule],
  controllers: [
    ClerkWebhooksController,
    SentryWebhooksController,
    SonarqubeWebhooksController,
  ],
  providers: [
    ClerkWebhooksService,
    SentryWebhooksService,
    SonarqubeWebhooksService,
    LinearTicketService,
    AuditLoggerService,
    SessionService,
    EmailService,
    RateLimitGuard,
    WebhookSecretGuard,
  ],
  exports: [ClerkWebhooksService],
})
export class WebhooksModule {}
