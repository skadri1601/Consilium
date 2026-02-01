import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth.service";
import { AuditLoggerService } from "../../../shared/services/audit-logger.service";
import { SessionService } from "../../../shared/services/session.service";
import { CliTokenService } from "../services/cli-token.service";

const CLI_TOKEN_PREFIX = "consilium_";

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogger: AuditLoggerService,
    private readonly sessionService: SessionService,
    private readonly cliTokenService: CliTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const ip = request.ip || request.headers["x-forwarded-for"] || "unknown";
    const userAgent = request.headers["user-agent"];

    // Support both Authorization header and token query parameter (for SSE)
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (request.query?.token) {
      token = request.query.token;
    }

    if (!token) {
      await this.auditLogger.log("login_failed", {
        ip,
        userAgent,
        metadata: { reason: "Missing token" },
      });
      throw new UnauthorizedException("Missing authorization header or token");
    }

    if (token.trim() === "") {
      await this.auditLogger.log("login_failed", {
        ip,
        userAgent,
        metadata: { reason: "Empty token" },
      });
      throw new UnauthorizedException("Token cannot be empty");
    }

    // CLI long-lived token: validate and set user (skip Clerk + session checks)
    if (token.startsWith(CLI_TOKEN_PREFIX)) {
      const cliUser = await this.cliTokenService.validate(token);
      if (cliUser) {
        request.user = { userId: cliUser.clerkId };
        return true;
      }
      throw new UnauthorizedException("Invalid or expired CLI token. Run: consilium login");
    }

    const session = await this.authService.verifyToken(token);

    if (!session) {
      await this.auditLogger.log("login_failed", {
        ip,
        userAgent,
        metadata: { reason: "Invalid token", tokenLength: token.length },
      });
      throw new UnauthorizedException("Invalid or expired token");
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.sessionService.isTokenBlacklisted(
      session.sub,
      token,
    );

    if (isBlacklisted) {
      await this.auditLogger.log("login_failed", {
        userId: session.sub,
        ip,
        userAgent,
        metadata: { reason: "Token blacklisted" },
        severity: "high",
      });
      throw new UnauthorizedException("Session has been revoked");
    }

    // Check if session is idle (optional - can be bypassed for certain endpoints)
    const isIdle = await this.sessionService.isIdle(session.sub);
    if (isIdle) {
      await this.auditLogger.log("session_revoked", {
        userId: session.sub,
        ip,
        userAgent,
        metadata: { reason: "Session idle timeout" },
      });
      throw new UnauthorizedException("Session expired due to inactivity");
    }

    // Update session activity
    await this.sessionService.updateActivity(session.sub, token);

    request.user = {
      userId: session.sub,
      sessionId: session.sid,
    };

    return true;
  }
}
