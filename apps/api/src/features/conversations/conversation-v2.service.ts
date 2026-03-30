import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";

@Injectable()
export class ConversationV2Service {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, title: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.conversationV2.create({
      data: {
        userId: user.id,
        title: title || "New Conversation",
      },
    });
  }

  async list(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return [];
    }

    return this.prisma.conversationV2.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        debates: {
          select: {
            id: true,
            topic: true,
            status: true,
            mode: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async get(id: string, userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const conversation = await this.prisma.conversationV2.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: {
        debates: {
          include: {
            rounds: {
              include: { messages: true },
              orderBy: { roundNumber: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    return conversation;
  }

  async delete(id: string, userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const conversation = await this.prisma.conversationV2.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    return this.prisma.conversationV2.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addDebate(
    conversationId: string,
    debateId: string,
    userId: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const conversation = await this.prisma.conversationV2.findFirst({
      where: { id: conversationId, userId: user.id, deletedAt: null },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    return this.prisma.debateSession.update({
      where: { id: debateId },
      data: { conversationId },
    });
  }
}
