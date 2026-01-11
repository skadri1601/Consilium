import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreateDebateDto } from "./dto/create-debate.dto";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { AiWorkersClient } from "./ai-workers.client";

@Injectable()
export class DebatesService {
  constructor(
    private prisma: PrismaService,
    private apiKeysService: ApiKeysService,
    private aiWorkersClient: AiWorkersClient,
  ) {}

  async createDebate(userId: string, dto: CreateDebateDto) {
    // Get user's API keys (BYOK or from env)
    const apiKeys = await this.apiKeysService.getUserApiKeys(userId);

    // Check if at least one API key is available
    const hasKeys =
      apiKeys.openaiKey || apiKeys.anthropicKey || apiKeys.googleKey || apiKeys.groqKey;
    if (!hasKeys) {
      throw new BadRequestException(
        "No API keys configured. Please add API keys in settings."
      );
    }

    // Create debate session
    const debate = await (this.prisma as any).debateSession.create({
      data: {
        userId,
        topic: dto.topic,
        status: "pending",
        modelsUsed: dto.models,
        totalCost: 0,
      },
    });

    // Start debate workflow in AI workers (async, will update status via SSE)
    try {
      await this.aiWorkersClient.startDebate({
        topic: dto.topic,
        models: dto.models,
        apiKeys: {
          openaiKey: apiKeys.openaiKey,
          anthropicKey: apiKeys.anthropicKey,
          googleKey: apiKeys.googleKey,
          groqKey: apiKeys.groqKey,
        },
      });
      
      // Update status to processing
      await this.updateStatus(debate.id, "processing");
    } catch (error) {
      // If AI workers fail, mark debate as failed
      await this.updateStatus(debate.id, "failed");
      throw error;
    }

    return debate;
  }

  async findAll(userId: string, limit: number = 20, offset: number = 0) {
    return (this.prisma as any).debateSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        rounds: {
          include: {
            messages: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const debate = await (this.prisma as any).debateSession.findFirst({
      where: { id, userId },
      include: {
        rounds: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!debate) {
      throw new NotFoundException("Debate session not found");
    }

    return debate;
  }

  async updateStatus(id: string, status: string, goldenPrompt?: string) {
    return (this.prisma as any).debateSession.update({
      where: { id },
      data: {
        status,
        ...(goldenPrompt && { goldenPrompt }),
      },
    });
  }

  async addRound(sessionId: string, roundNumber: number) {
    return (this.prisma as any).debateRound.create({
      data: {
        sessionId,
        roundNumber,
        status: "pending",
      },
    });
  }

  async addMessage(
    roundId: string,
    agentId: string,
    modelUsed: string,
    content: string,
    promptTokens: number,
    completionTokens: number,
    cost: number,
    latencyMs: number,
  ) {
    return (this.prisma as any).debateMessage.create({
      data: {
        roundId,
        agentId,
        modelUsed,
        content,
        promptTokens,
        completionTokens,
        cost,
        latencyMs,
      },
    });
  }

  async updateTotalCost(sessionId: string, cost: number) {
    return (this.prisma as any).debateSession.update({
      where: { id: sessionId },
      data: { totalCost: { increment: cost } },
    });
  }
}

