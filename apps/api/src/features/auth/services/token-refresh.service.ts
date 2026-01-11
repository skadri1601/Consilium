import { Injectable, Logger } from "@nestjs/common";
import { SessionService } from "../../../shared/services/session.service";

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(private sessionService: SessionService) {}

  async shouldRefresh(expiresAt: Date): Promise<boolean> {
    return this.sessionService.shouldRefreshToken(expiresAt);
  }

  async refreshTokenIfNeeded(userId: string, currentToken: string, expiresAt: Date): Promise<string | null> {
    if (await this.shouldRefresh(expiresAt)) {
      this.logger.log(`Token refresh needed for user ${userId}`);
      // In a real implementation, this would call Clerk to refresh the token
      // For now, return null to indicate refresh is needed but not implemented
      return null;
    }
    return currentToken;
  }
}

