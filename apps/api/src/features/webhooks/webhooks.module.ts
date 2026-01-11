import { Module } from "@nestjs/common";
import { ClerkWebhooksController } from "./clerk-webhooks.controller";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { PrismaModule } from "../../shared/database";
import { AuditLoggerService } from "../../shared/services/audit-logger.service";
import { SessionService } from "../../shared/services/session.service";

@Module({
  imports: [PrismaModule],
  controllers: [ClerkWebhooksController],
  providers: [ClerkWebhooksService, AuditLoggerService, SessionService],
  exports: [ClerkWebhooksService],
})
export class WebhooksModule {}

