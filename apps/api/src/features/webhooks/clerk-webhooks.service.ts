import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { AuditLoggerService } from "../../shared/services/audit-logger.service";
import { SessionService } from "../../shared/services/session.service";
import { EmailService } from "../../shared/services/email.service";

interface CreateUserPayload {
  clerkId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

@Injectable()
export class ClerkWebhooksService {
  private readonly logger = new Logger(ClerkWebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private auditLogger: AuditLoggerService,
    private sessionService: SessionService,
    private emailService: EmailService,
  ) {}

  async createUser(
    payload: CreateUserPayload,
  ): Promise<{ success: boolean; userId: string }> {
    const { clerkId, email, firstName, lastName, imageUrl } = payload;

    if (!email) {
      throw new Error("Email is required for user creation");
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      this.logger.log(`User already exists: ${clerkId}, updating instead`);
      return this.updateUser(payload);
    }

    const user = await this.prisma.user.create({
      data: {
        clerkId,
        email,
        firstName,
        lastName,
        imageUrl,
        tenantId: clerkId, // Default tenant is the user themselves
      },
    });

    this.logger.log(`Created user: ${user.id} (Clerk: ${clerkId})`);

    await this.auditLogger.log("session_created", {
      userId: user.id,
      metadata: { source: "clerk_webhook", action: "user.created" },
    });

    setImmediate(() => {
      this.emailService
        .sendWelcomeEmail(email, firstName || "")
        .catch((err) =>
          this.logger.error(
            `Welcome email failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          ),
        );
    });

    return { success: true, userId: user.id };
  }

  async updateUser(
    payload: CreateUserPayload,
  ): Promise<{ success: boolean; userId: string }> {
    const { clerkId, email, firstName, lastName, imageUrl } = payload;

    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      this.logger.warn(
        `User not found for update: ${clerkId}, creating instead`,
      );
      return this.createUser(payload);
    }

    const updatedUser = await this.prisma.user.update({
      where: { clerkId },
      data: {
        ...(email && { email }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    this.logger.log(`Updated user: ${updatedUser.id} (Clerk: ${clerkId})`);

    return { success: true, userId: updatedUser.id };
  }

  async deleteUser(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        conversations: true,
        agents: true,
      },
    });

    if (!user) {
      this.logger.warn(`User not found for deletion: ${clerkId}`);
      return { success: true, message: "User not found, nothing to delete" };
    }

    // Get count of related records that will be deleted
    const debateSessionsCount = await this.prisma.councilSession.count({
      where: { tenantId: user.tenantId },
    });

    const userWithRelations = user as typeof user & {
      conversations?: { id: string }[];
      agents?: { id: string }[];
    };
    const conversations = userWithRelations.conversations || [];
    const agents = userWithRelations.agents || [];

    // Log the deletion before it happens
    await this.auditLogger.log("session_revoked", {
      userId: user.id,
      metadata: {
        source: "clerk_webhook",
        action: "user.deleted",
        deletedData: {
          debateSessions: debateSessionsCount,
          conversations: conversations.length,
          agents: agents.length,
        },
      },
      severity: "high",
    });

    // Delete user (cascades to related records due to onDelete: Cascade)
    await this.prisma.user.delete({
      where: { clerkId },
    });

    this.logger.log(`Deleted user: ${user.id} (Clerk: ${clerkId})`);

    return { success: true, userId: user.id };
  }

  async handleSessionEnded(userId: string, sessionId: string) {
    // The session is already revoked in Clerk, we just need to log it
    // and potentially blacklist any tokens associated with this session

    await this.auditLogger.log("session_revoked", {
      userId,
      metadata: {
        sessionId,
        source: "clerk_webhook",
      },
    });

    this.logger.log(`Session ended for user: ${userId}, session: ${sessionId}`);

    return { success: true };
  }
}
