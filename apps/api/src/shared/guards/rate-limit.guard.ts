import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";

export const RATE_LIMIT_KEY = "rateLimit";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.redis.status !== "ready") {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const metadata = this.reflector.get<{ limit: number; window: number }>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    const limit = metadata?.limit ?? 100;
    const window = metadata?.window ?? 60;
    const key = this.getKey(request);

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

      const response = context.switchToHttp().getResponse();
      response.header("X-RateLimit-Limit", limit);
      response.header("X-RateLimit-Remaining", Math.max(0, limit - current));
      response.header("X-RateLimit-Reset", Date.now() + window * 1000);

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.debug(
        `Redis error in rate limiting, allowing request: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return true;
    }
  }

  private getKey(request: any): string {
    const userId = request.user?.userId || request.ip;
    const path = request.url.split("?")[0];
    return `rate-limit:${userId}:${path}`;
  }
}
