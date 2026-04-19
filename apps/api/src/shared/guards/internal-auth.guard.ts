import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

@Injectable()
export class InternalAuthGuard implements CanActivate {
  private readonly logger = new Logger(InternalAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const raw = request.headers["x-internal-secret"];
    const secret = Array.isArray(raw) ? raw[0] : raw;
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (!expectedSecret) {
      this.logger.error("INTERNAL_API_SECRET not configured");
      throw new UnauthorizedException("Internal endpoint not configured");
    }

    if (typeof secret !== "string" || !safeCompare(secret, expectedSecret)) {
      throw new UnauthorizedException("Unauthorized");
    }

    return true;
  }
}
