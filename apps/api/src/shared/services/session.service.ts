import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { Redis } from "ioredis";
import { InjectRedis } from "@nestjs-modules/ioredis";

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry
  private redisAvailable = false;

  constructor(
    private prisma: PrismaService,
    @InjectRedis() private redis: Redis,
  ) {
    // Set up Redis error handling
    this.redis.on("error", (error) => {
      this.redisAvailable = false;
      this.logger.debug(`Redis error in SessionService: ${error.message}`);
    });

    this.redis.on("connect", () => {
      this.redisAvailable = true;
      this.logger.debug("Redis connected for SessionService");
    });

    // Check if already connected
    if (this.redis.status === "ready") {
      this.redisAvailable = true;
    }
  }

  async trackSession(userId: string, token: string, expiresAt: Date): Promise<void> {
    if (!this.redisAvailable) {
      this.logger.debug("Redis unavailable, skipping session tracking");
      return;
    }

    try {
      const sessionKey = `session:${userId}:${token}`;
      const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

      await this.redis.setex(sessionKey, expiresIn, JSON.stringify({
        userId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      }));

      // Track idle timeout
      await this.redis.setex(`idle:${userId}`, Math.floor(this.IDLE_TIMEOUT_MS / 1000), "1");
    } catch (error) {
      this.logger.debug(`Failed to track session: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      // Reset idle timeout
      await this.redis.setex(`idle:${userId}`, Math.floor(this.IDLE_TIMEOUT_MS / 1000), "1");
    } catch (error) {
      this.logger.debug(`Failed to update activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isTokenBlacklisted(userId: string, token: string): Promise<boolean> {
    if (!this.redisAvailable) {
      this.logger.debug("Redis unavailable, token blacklist check skipped");
      return false; // If Redis is down, allow the token (fail open)
    }

    try {
      const blacklistKey = `blacklist:${userId}:${token}`;
      const exists = await this.redis.exists(blacklistKey);
      return exists === 1;
    } catch (error) {
      this.logger.debug(`Failed to check token blacklist: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false; // Fail open if Redis is unavailable
    }
  }

  async blacklistToken(userId: string, token: string, expiresAt: Date): Promise<void> {
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
      this.logger.debug(`Failed to blacklist token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isIdle(userId: string): Promise<boolean> {
    if (!this.redisAvailable) {
      this.logger.debug("Redis unavailable, idle check skipped");
      return false; // If Redis is down, don't consider sessions idle (fail open)
    }

    try {
      const idleKey = `idle:${userId}`;
      const exists = await this.redis.exists(idleKey);
      return exists === 0;
    } catch (error) {
      this.logger.debug(`Failed to check idle status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false; // Fail open if Redis is unavailable
    }
  }

  async shouldRefreshToken(expiresAt: Date): Promise<boolean> {
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    return timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD_MS;
  }
}

