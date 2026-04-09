import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import { Redis } from "ioredis";
import { AuthService } from "../auth.service";
import { PrismaService } from "../../../shared/database/prisma.service";
import { AuditLoggerService } from "../../../shared/services/audit-logger.service";
import { SessionService } from "../../../shared/services/session.service";
import { CliTokenService } from "../services/cli-token.service";

const CLI_TOKEN_PREFIX = "consilium_";
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW = 60;
const IP_TRACKING_WINDOW = 60;
const SUSPICIOUS_IP_THRESHOLD = 3;

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly authService: AuthService,
    private readonly auditLogger: AuditLoggerService,
    private readonly sessionService: SessionService,
    private readonly cliTokenService: CliTokenService,
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private async prismaFallbackUser(): Promise<any> {
    try {
      return await this.prisma.user.findFirst({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      return null;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const ip = request.ip || request.headers["x-forwarded-for"] || "unknown";
    const userAgent = request.headers["user-agent"] || "";

    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (request.query?.token) {
      token = request.query.token;
    }

    if (!token) {
      // Only allow development bypass when explicitly set to "development"
      // Never bypass auth when NODE_ENV is undefined (could indicate misconfiguration)
      if (process.env.NODE_ENV === "development") {
        const devUser = await this.prismaFallbackUser();
        if (devUser) {
          request.user = {
            userId: devUser.clerkId,
            tenantId: devUser.tenantId || devUser.clerkId,
          };
          return true;
        }
      }
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

    if (token.startsWith(CLI_TOKEN_PREFIX)) {
      const cliUser = await this.cliTokenService.validate(token);
      if (cliUser) {
        request.user = { userId: cliUser.clerkId };
        return true;
      }
      throw new UnauthorizedException(
        "Invalid or expired CLI token. Run: consilium login",
      );
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

    const fingerprint = this.sessionService.generateFingerprint(userAgent, ip);
    const fingerprintValid =
      await this.sessionService.validateSessionFingerprint(
        session.sub,
        token,
        fingerprint,
      );

    if (!fingerprintValid) {
      await this.auditLogger.log("suspicious_activity", {
        userId: session.sub,
        ip,
        userAgent,
        metadata: { reason: "Session fingerprint mismatch" },
        severity: "critical",
      });
      throw new UnauthorizedException("Session validation failed");
    }

    await this.checkRateLimit(session.sub);
    await this.trackIpActivity(session.sub, ip);

    await this.sessionService.updateActivity(session.sub, token);

    request.user = {
      userId: session.sub,
      sessionId: session.sid,
    };

    return true;
  }

  private async checkRateLimit(userId: string): Promise<void> {
    if (this.redis.status !== "ready") {
      return;
    }

    try {
      const key = `auth-rate:${userId}`;
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, RATE_LIMIT_WINDOW);
      }

      if (current > RATE_LIMIT_MAX) {
        await this.auditLogger.log("suspicious_activity", {
          userId,
          metadata: {
            reason: "Rate limit exceeded",
            requestCount: current,
            window: RATE_LIMIT_WINDOW,
          },
          severity: "high",
        });
        throw new UnauthorizedException("Too many requests");
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.debug(
        `Rate limit check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async trackIpActivity(userId: string, ip: string): Promise<void> {
    if (this.redis.status !== "ready") {
      return;
    }

    try {
      const key = `auth-ips:${userId}`;
      await this.redis.sadd(key, ip);
      await this.redis.expire(key, IP_TRACKING_WINDOW);

      const uniqueIps = await this.redis.scard(key);

      if (uniqueIps >= SUSPICIOUS_IP_THRESHOLD) {
        const ips = await this.redis.smembers(key);
        this.logger.warn(
          `Suspicious activity: user ${userId} accessed from ${uniqueIps} IPs within ${IP_TRACKING_WINDOW}s`,
        );
        await this.auditLogger.log("suspicious_activity", {
          userId,
          ip,
          metadata: {
            reason: "Multiple IPs detected",
            uniqueIps,
            ips,
            window: IP_TRACKING_WINDOW,
          },
          severity: "high",
        });
      }
    } catch (error) {
      this.logger.debug(
        `IP tracking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
