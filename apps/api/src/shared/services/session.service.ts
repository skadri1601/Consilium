import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { Redis } from "ioredis";
import { InjectRedis } from "@nestjs-modules/ioredis";
import * as crypto from "crypto";

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  private readonly TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
  private readonly MAX_CONCURRENT_SESSIONS = 5;
  private redisAvailable = false;

  constructor(
    private prisma: PrismaService,
    @InjectRedis() private redis: Redis,
  ) {
    this.redis.on("error", (error) => {
      this.redisAvailable = false;
      this.logger.debug(`Redis error in SessionService: ${error.message}`);
    });

    this.redis.on("connect", () => {
      this.redisAvailable = true;
      this.logger.debug("Redis connected for SessionService");
    });

    if (this.redis.status === "ready") {
      this.redisAvailable = true;
    }
  }

  generateFingerprint(userAgent: string, ip: string): string {
    return crypto
      .createHash("sha256")
      .update(`${userAgent}:${ip}`)
      .digest("hex")
      .substring(0, 16);
  }

  async trackSession(
    userId: string,
    token: string,
    expiresAt: Date,
    fingerprint?: string,
  ): Promise<void> {
    if (!this.redisAvailable) {
      this.logger.debug("Redis unavailable, rejecting session tracking");
      return;
    }

    try {
      const sessionCount = await this.getActiveSessionCount(userId);
      if (sessionCount >= this.MAX_CONCURRENT_SESSIONS) {
        this.logger.warn(
          `User ${userId} exceeded max concurrent sessions (${this.MAX_CONCURRENT_SESSIONS})`,
        );
        await this.evictOldestSession(userId);
      }

      const sessionKey = `session:${userId}:${token}`;
      const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

      await this.redis.setex(
        sessionKey,
        expiresIn,
        JSON.stringify({
          userId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          fingerprint: fingerprint || null,
        }),
      );

      await this.redis.sadd(`sessions:${userId}`, token);
      await this.redis.expire(`sessions:${userId}`, expiresIn);

      await this.redis.setex(
        `idle:${userId}`,
        Math.floor(this.IDLE_TIMEOUT_MS / 1000),
        "1",
      );
    } catch (error) {
      this.logger.debug(
        `Failed to track session: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async validateSessionFingerprint(
    userId: string,
    token: string,
    currentFingerprint: string,
  ): Promise<boolean> {
    if (!this.redisAvailable) {
      return this.isDevMode() ? true : false;
    }

    try {
      const sessionKey = `session:${userId}:${token}`;
      const sessionData = await this.redis.get(sessionKey);

      if (!sessionData) {
        return true;
      }

      const data = JSON.parse(sessionData);
      if (data.fingerprint && data.fingerprint !== currentFingerprint) {
        this.logger.warn(
          `Session fingerprint mismatch for user ${userId}: expected ${data.fingerprint}, got ${currentFingerprint}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.debug(
        `Failed to validate fingerprint: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false;
    }
  }

  async updateActivity(userId: string, token: string): Promise<void> {
    if (!this.redisAvailable) {
      this.logger.debug("Redis unavailable, skipping activity update");
      return;
    }

    try {
      const sessionKey = `session:${userId}:${token}`;
      const sessionData = await this.redis.get(sessionKey);

      if (sessionData) {
        const data = JSON.parse(sessionData);
        data.lastActivity = new Date().toISOString();
        const ttl = await this.redis.ttl(sessionKey);
        await this.redis.setex(sessionKey, ttl, JSON.stringify(data));
      }

      await this.redis.setex(
        `idle:${userId}`,
        Math.floor(this.IDLE_TIMEOUT_MS / 1000),
        "1",
      );
    } catch (error) {
      this.logger.debug(
        `Failed to update activity: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private isDevMode(): boolean {
    return process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  }

  async isTokenBlacklisted(userId: string, token: string): Promise<boolean> {
    if (!this.redisAvailable) {
      if (this.isDevMode()) {
        this.logger.debug(
          "Redis unavailable in dev mode, allowing token (fail-open)",
        );
        return false;
      }
      this.logger.warn("Redis unavailable, rejecting token (fail-closed)");
      return true;
    }

    try {
      const blacklistKey = `blacklist:${userId}:${token}`;
      const exists = await this.redis.exists(blacklistKey);
      return exists === 1;
    } catch (error) {
      this.logger.debug(
        `Failed to check token blacklist: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return this.isDevMode() ? false : true;
    }
  }

  async blacklistToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!this.redisAvailable) {
      this.logger.debug("Redis unavailable, skipping token blacklist");
      return;
    }

    try {
      const blacklistKey = `blacklist:${userId}:${token}`;
      const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      await this.redis.setex(blacklistKey, expiresIn, "1");
      this.logger.log(`Token blacklisted for user ${userId}`);
    } catch (error) {
      this.logger.debug(
        `Failed to blacklist token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async isIdle(userId: string): Promise<boolean> {
    if (!this.redisAvailable) {
      if (this.isDevMode()) {
        this.logger.debug(
          "Redis unavailable in dev mode, allowing session (fail-open)",
        );
        return false;
      }
      this.logger.warn("Redis unavailable, rejecting session (fail-closed)");
      return true;
    }

    try {
      const idleKey = `idle:${userId}`;
      const exists = await this.redis.exists(idleKey);
      if (exists === 0) {
        await this.redis.setex(
          idleKey,
          Math.floor(this.IDLE_TIMEOUT_MS / 1000),
          "1",
        );
        return false;
      }
      return false;
    } catch (error) {
      this.logger.debug(
        `Failed to check idle status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return this.isDevMode() ? false : true;
    }
  }

  async shouldRefreshToken(expiresAt: Date): Promise<boolean> {
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    return timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD_MS;
  }

  private async getActiveSessionCount(userId: string): Promise<number> {
    try {
      return await this.redis.scard(`sessions:${userId}`);
    } catch {
      return 0;
    }
  }

  private async evictOldestSession(userId: string): Promise<void> {
    try {
      const tokens = await this.redis.smembers(`sessions:${userId}`);
      let oldestToken: string | null = null;
      let oldestTime = Infinity;

      for (const token of tokens) {
        const sessionData = await this.redis.get(`session:${userId}:${token}`);
        if (!sessionData) {
          await this.redis.srem(`sessions:${userId}`, token);
          continue;
        }

        const data = JSON.parse(sessionData);
        const createdAt = new Date(data.createdAt).getTime();
        if (createdAt < oldestTime) {
          oldestTime = createdAt;
          oldestToken = token;
        }
      }

      if (oldestToken) {
        await this.redis.del(`session:${userId}:${oldestToken}`);
        await this.redis.srem(`sessions:${userId}`, oldestToken);
        this.logger.debug(`Evicted oldest session for user ${userId}`);
      }
    } catch (error) {
      this.logger.debug(
        `Failed to evict session: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
