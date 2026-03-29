import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";

@Injectable()
export class InternalAuthGuard implements CanActivate {
  private readonly logger = new Logger(InternalAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers["x-internal-secret"];
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (!expectedSecret) {
      this.logger.error("INTERNAL_API_SECRET not configured");
      throw new UnauthorizedException("Internal endpoint not configured");
    }

    if (!secret || secret !== expectedSecret) {
      throw new UnauthorizedException("Unauthorized");
    }

    return true;
  }
}
