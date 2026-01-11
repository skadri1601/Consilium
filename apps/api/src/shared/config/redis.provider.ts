import { Provider, Logger } from "@nestjs/common";
import Redis from "ioredis";

const logger = new Logger("RedisProvider");

export const RedisProvider: Provider = {
  provide: "REDIS_CLIENT",
  useFactory: () => {
    const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379";
    const redisToken = process.env.UPSTASH_REDIS_TOKEN;

    let redis: Redis;

    if (redisToken) {
      // Upstash Redis
      redis = new Redis(redisUrl, {
        password: redisToken,
        tls: {
          rejectUnauthorized: false,
        },
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn("Redis connection failed after multiple retries. Redis features will be unavailable.");
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    } else {
      // Local Redis
      redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn("Redis connection failed after multiple retries. Redis features will be unavailable.");
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    }

    // Handle connection errors gracefully
    redis.on("error", (error) => {
      logger.error(`Redis connection error: ${error.message}`);
    });

    redis.on("connect", () => {
      logger.log("Redis connected successfully");
    });

    // Attempt to connect, but don't fail if it doesn't work
    redis.connect().catch(() => {
      logger.warn("Redis connection failed. Application will continue without Redis features.");
    });

    return redis;
  },
};

