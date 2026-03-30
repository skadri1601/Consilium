import { Injectable, Logger } from "@nestjs/common";
import { createClerkClient } from "@clerk/clerk-sdk-node";

@Injectable()
export class AuthService {
  private clerk;
  private readonly logger = new Logger(AuthService.name);

  constructor() {
    this.clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  async verifyToken(token: string): Promise<any | null> {
    try {
      if (!token || token.trim() === "") {
        this.logger.warn("verifyToken called with empty token");
        return null;
      }

      const session = await this.clerk.verifyToken(token);
      return session;
    } catch (error) {
      this.logger.warn(
        `Token verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  async getUser(userId: string) {
    try {
      const user = await this.clerk.users.getUser(userId);
      return user;
    } catch (error) {
      this.logger.warn(
        `Failed to get user ${userId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      await this.clerk.sessions.revokeSession(sessionId);
      this.logger.log(`Session revoked: ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to revoke session ${sessionId}:`, error);
      return false;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<boolean> {
    try {
      const sessions = await this.clerk.sessions.getSessionList({ userId });

      for (const session of sessions.data) {
        if (session.status === "active") {
          await this.clerk.sessions.revokeSession(session.id);
        }
      }

      this.logger.log(`All sessions revoked for user: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to revoke all sessions for user ${userId}:`,
        error,
      );
      return false;
    }
  }

  async getUserSessions(userId: string) {
    try {
      const sessions = await this.clerk.sessions.getSessionList({ userId });
      return sessions.data.filter((s: any) => s.status === "active");
    } catch (error) {
      this.logger.error(`Failed to get sessions for user ${userId}:`, error);
      return [];
    }
  }
}
