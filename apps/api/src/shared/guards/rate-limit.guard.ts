import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, { count: number; timestamp: number }>();
  private readonly limit = 100;
  private readonly windowMs = 60000; // 1 minute

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers["x-forwarded-for"] || "unknown";
    const key = `${ip}:${request.url}`;

    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now - record.timestamp > this.windowMs) {
      this.requests.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= this.limit) {
      throw new HttpException(
        "Too many requests",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count++;
    return true;
  }
}
