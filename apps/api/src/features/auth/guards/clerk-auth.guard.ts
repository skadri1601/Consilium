import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing authorization header");
    }

    const token = authHeader.substring(7);
    const session = await this.authService.verifyToken(token);

    if (!session) {
      throw new UnauthorizedException("Invalid token");
    }

    request.user = {
      userId: session.sub,
      sessionId: session.sid,
    };

    return true;
  }
}
