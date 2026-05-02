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

  private extractToken(request: { headers: any; query?: any }): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
    if (request.query?.token) {
      return request.query.token;
    }
    return undefined;
  }

  private normalizeClientIp(request: { ip?: string; headers?: any }): string {
    const raw = request.ip || request.headers?.["x-forwarded-for"] || "unknown";
    if (typeof raw === "string") {
      const first = raw
        .split(",")
        .map((s) => s.trim())
        .find((s) => s.length > 0);
      return first ?? "unknown";
    }
    if (Array.isArray(raw)) return raw[0] ?? "unknown";
    return "unknown";
  }

  private async tryDevBypassWithoutToken(request: any): Promise<boolean> {
    if (process.env.NODE_ENV === undefined) {
      this.logger.warn("tryDevBypassWithoutToken: NODE_ENV unset; dev bypass disabled");
      return false;
    }
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) return false;
    const devUser = await this.prismaFallbackUser();
    if (!devUser) return false;
    request.user = {
      userId: devUser.clerkId,
      tenantId: devUser.tenantId || devUser.clerkId,
    };
    return true;
  }

  private async auditMissingTokenAndThrow(
    ip: string,
    userAgent: string,
    reason: string,
    message: string,
  ): Promise<never> {
    await this.auditLogger.log("login_failed", {
      ip,
      userAgent,
      metadata: { reason },
    });
    throw new UnauthorizedException(message);
  }

  private async validateCliTokenOrThrow(
    request: any,
    token: string,
  ): Promise<boolean> {
    const cliUser = await this.cliTokenService.validate(token);
    if (cliUser) {
      request.user = { userId: cliUser.clerkId };
      return true;
    }
    throw new UnauthorizedException(
      "Invalid or expired CLI token. Run: consilium login",
    );
  }

  private async assertSessionNotBlacklisted(
    clerkSub: string,
    token: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    const isBlacklisted = await this.sessionService.isTokenBlacklisted(
      clerkSub,
      token,
    );
    if (!isBlacklisted) return;
    await this.auditLogger.log("login_failed", {
      userId: clerkSub,
      ip,
      userAgent,
      metadata: { reason: "Token blacklisted" },
      severity: "high",
    });
    throw new UnauthorizedException("Session has been revoked");
  }

  private async assertSessionNotIdle(
    clerkSub: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    const isIdle = await this.sessionService.isIdle(clerkSub);
    if (!isIdle) return;
    await this.auditLogger.log("session_revoked", {
      userId: clerkSub,
      ip,
      userAgent,
      metadata: { reason: "Session idle timeout" },
    });
    throw new UnauthorizedException("Session expired due to inactivity");
  }

  private async assertFingerprintValid(
    clerkSub: string,
    token: string,
    userAgent: string,
    ip: string,
  ): Promise<void> {
    const fingerprint = this.sessionService.generateFingerprint(userAgent, ip);
    const fingerprintValid =
      await this.sessionService.validateSessionFingerprint(
        clerkSub,
        token,
        fingerprint,
      );
    if (fingerprintValid) return;
    await this.auditLogger.log("suspicious_activity", {
      userId: clerkSub,
      ip,
      userAgent,
      metadata: { reason: "Session fingerprint mismatch" },
      severity: "critical",
    });
    throw new UnauthorizedException("Session validation failed");
  }

  private async activateClerkSession(
    request: any,
    token: string,
    ip: string,
    userAgent: string,
  ): Promise<boolean> {
    const session = await this.authService.verifyToken(token);
    if (!session) {
      await this.auditLogger.log("login_failed", {
        ip,
        userAgent,
        metadata: { reason: "Invalid token", tokenLength: token.length },
      });
      throw new UnauthorizedException("Invalid or expired token");
    }

    await this.assertSessionNotBlacklisted(session.sub, token, ip, userAgent);
    await this.assertSessionNotIdle(session.sub, ip, userAgent);
    await this.assertFingerprintValid(session.sub, token, userAgent, ip);

    await this.checkRateLimit(session.sub);
    await this.trackIpActivity(session.sub, ip);
    await this.sessionService.updateActivity(session.sub, token);

    request.user = {
      userId: session.sub,
      sessionId: session.sid,
    };

    try {
      await this.ensureUserExists(session.sub);
    } catch (err) {
      this.logger.warn(
        `JIT user sync failed for ${session.sub}: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    }

    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientIp = this.normalizeClientIp(request);
    const userAgent = request.headers["user-agent"] || "";
    const rawToken = this.extractToken(request);

    if (rawToken === undefined || rawToken === null || rawToken === "") {
      const devOk = await this.tryDevBypassWithoutToken(request);
      if (devOk) return true;
      await this.auditMissingTokenAndThrow(
        clientIp,
        userAgent,
        "Missing token",
        "Missing authorization header or token",
      );
    }

    const token = rawToken!.trim();
    if (token === "") {
      await this.auditMissingTokenAndThrow(
        clientIp,
        userAgent,
        "Empty token",
        "Token cannot be empty",
      );
    }

    if (token.startsWith(CLI_TOKEN_PREFIX)) {
      return this.validateCliTokenOrThrow(request, token);
    }

    return this.activateClerkSession(request, token, clientIp, userAgent);
  }

  private async ensureUserExists(clerkId: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (existing) return;

    const clerkUser = await this.authService.getUser(clerkId);
    if (!clerkUser) {
      this.logger.warn(
        `JIT user sync: Clerk getUser(${clerkId}) returned null. Check CLERK_SECRET_KEY and Clerk SDK status.`,
      );
      return;
    }

    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress || `${clerkId}@clerk.local`;
    await this.prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email,
        firstName: clerkUser.firstName ?? undefined,
        lastName: clerkUser.lastName ?? undefined,
        imageUrl: clerkUser.imageUrl ?? undefined,
        tenantId: clerkId,
      },
      update: {},
    });
    this.logger.log(`Auto-synced Clerk user ${clerkId}`);
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
