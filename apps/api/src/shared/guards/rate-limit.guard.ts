import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis;
  private readonly defaultLimit: number;
  private readonly defaultWindow: number; // in seconds
  private readonly logger = new Logger(RateLimitGuard.name);
  private redisAvailable = false;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    this.redis = new Redis(redisUrl || "redis://localhost:6379", {
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn("Redis connection failed. Rate limiting will be disabled.");
          this.redisAvailable = false;
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    this.redis.on("error", (error) => {
      this.redisAvailable = false;
      this.logger.debug(`Redis error in RateLimitGuard: ${error.message}`);
    });

    this.redis.on("connect", () => {
      this.redisAvailable = true;
      this.logger.debug("Redis connected for rate limiting");
    });

    // Attempt to connect
    this.redis.connect().catch(() => {
      this.redisAvailable = false;
      this.logger.warn("Redis unavailable. Rate limiting disabled.");
    });

    this.defaultLimit = 100; // requests
    this.defaultWindow = 60; // per minute
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // If Redis is not available, skip rate limiting
    if (!this.redisAvailable) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);
    const limit = this.getLimit(request);
    const window = this.getWindow(request);

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, window);
      }

      if (current > limit) {
        const ttl = await this.redis.ttl(key);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: "Too many requests, please try again later",
            retryAfter: ttl,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Add rate limit headers
      const response = context.switchToHttp().getResponse();
      response.header("X-RateLimit-Limit", limit);
      response.header("X-RateLimit-Remaining", Math.max(0, limit - current));
      response.header("X-RateLimit-Reset", Date.now() + window * 1000);

      return true;
    } catch (error) {
      // If it's an HttpException (rate limit exceeded), rethrow it
      if (error instanceof HttpException) {
        throw error;
      }
      // Otherwise, Redis error - allow request through
      this.logger.debug(`Redis error in rate limiting, allowing request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return true;
    }
  }

  private getKey(request: any): string {
    const userId = request.user?.userId || request.ip;
    const path = request.url.split("?")[0];
    return `rate-limit:${userId}:${path}`;
  }

  private getLimit(request: any): number {
    // Can be customized per endpoint
    return this.defaultLimit;
  }

  private getWindow(request: any): number {
    // Can be customized per endpoint
    return this.defaultWindow;
  }
}
