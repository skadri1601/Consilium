import { Injectable } from "@nestjs/common";
import { createClerkClient } from "@clerk/clerk-sdk-node";

@Injectable()
export class AuthService {
  private clerk;

  constructor() {
    this.clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  async verifyToken(token: string): Promise<any | null> {
    try {
      const session = await this.clerk.verifyToken(token);
      return session;
    } catch (error) {
      return null;
    }
  }

  async getUser(userId: string) {
    try {
      const user = await this.clerk.users.getUser(userId);
      return user;
    } catch (error) {
      return null;
    }
  }
}
