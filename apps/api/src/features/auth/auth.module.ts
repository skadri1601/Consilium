import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ClerkAuthGuard } from "./guards/clerk-auth.guard";
import { AuditLoggerService } from "../../shared/services/audit-logger.service";
import { SessionService } from "../../shared/services/session.service";
import { CliTokenService } from "./services/cli-token.service";
import { PrismaModule } from "../../shared/database";

@Module({
  imports: [PrismaModule],
  providers: [
    AuthService,
    ClerkAuthGuard,
    AuditLoggerService,
    SessionService,
    CliTokenService,
  ],
  exports: [
    AuthService,
    ClerkAuthGuard,
    AuditLoggerService,
    SessionService,
    CliTokenService,
  ],
})
export class AuthModule {}
