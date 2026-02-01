import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/database/prisma.service";
import * as crypto from "crypto";

const CLI_TOKEN_PREFIX = "consilium_";

@Injectable()
export class CliTokenService {
  constructor(private readonly prisma: PrismaService) {}

  private hash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generate a long-lived CLI token for the user. Stores hash in DB, returns plain token once.
   */
  async generate(clerkId: string): Promise<{ token: string }> {
    const raw = crypto.randomBytes(32).toString("hex");
    const token = `${CLI_TOKEN_PREFIX}${raw}`;
    const hash = this.hash(token);

    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new Error("User not found. Sign in on the web app first.");
    }

    await this.prisma.user.update({
      where: { clerkId },
      data: { cliTokenHash: hash },
    });

    return { token };
  }

  /**
   * Validate CLI token and return clerkId if valid.
   */
  async validate(token: string): Promise<{ clerkId: string } | null> {
    if (!token || !token.startsWith(CLI_TOKEN_PREFIX)) {
      return null;
    }
    const hash = this.hash(token);
    const user = await this.prisma.user.findFirst({
      where: { cliTokenHash: hash },
    });
    return user ? { clerkId: user.clerkId } : null;
  }
}
