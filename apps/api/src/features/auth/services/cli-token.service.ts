import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../shared/database/prisma.service";
import { createClerkClient } from "@clerk/backend";
import * as crypto from "crypto";

const CLI_TOKEN_PREFIX = "consilium_";

@Injectable()
export class CliTokenService {
  private readonly logger = new Logger(CliTokenService.name);
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(private readonly prisma: PrismaService) {}

  private hash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Ensure user exists in DB (create from Clerk if not). Then generate CLI token.
   */
  async generate(clerkId: string): Promise<{ token: string }> {
    try {
      let user = await this.prisma.user.findUnique({
        where: { clerkId },
      });

      if (!user) {
        // User may not be synced yet (e.g. no webhook). Create from Clerk.
        let email = `${clerkId}@clerk.user`;
        try {
          const clerkUser = await this.clerk.users.getUser(clerkId);
          if (clerkUser.emailAddresses?.length) {
            email = clerkUser.emailAddresses[0].emailAddress;
          }
        } catch {
          this.logger.warn(
            `Clerk getUser failed for ${clerkId}, using fallback email`,
          );
        }
        user = await this.prisma.user.upsert({
          where: { clerkId },
          create: {
            clerkId,
            email,
            tenantId: clerkId,
          },
          update: {},
        });
      }

      const raw = crypto.randomBytes(32).toString("hex");
      const token = `${CLI_TOKEN_PREFIX}${raw}`;
      const hash = this.hash(token);

      await this.prisma.user.update({
        where: { clerkId },
        data: { cliTokenHash: hash },
      });

      return { token };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `CLI token generate failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(`Failed to generate CLI token: ${msg}`);
    }
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
