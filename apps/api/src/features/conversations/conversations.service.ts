import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateConversationDto, userId: string) {
    return this.prisma.conversation.create({
      data: {
        title: dto.title || "New Conversation",
        mode: dto.mode || "visible",
        userId,
        tenantId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          include: {
            responses: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.conversation.delete({
      where: { id },
    });
  }

  async addMessage(conversationId: string, role: string, content: string) {
    return this.prisma.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });
  }
}
