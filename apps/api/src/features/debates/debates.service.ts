import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreateDebateDto } from "./dto/create-debate.dto";
import { DebateStatus } from "./debate-status";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { AiWorkersClient } from "./ai-workers.client";
import { PersonasService } from "../personas/personas.service";
import { MODEL_PRICING, FREE_FALLBACK_MODELS } from "./model-pricing";

@Injectable()
export class DebatesService {
  constructor(
    private prisma: PrismaService,
    private apiKeysService: ApiKeysService,
    private aiWorkersClient: AiWorkersClient,
    private personasService: PersonasService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async createDebate(userId: string, dto: CreateDebateDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException(
        "User not found. Please ensure your account is synced."
      );
    }

    const apiKeys = await this.apiKeysService.getUserApiKeys(userId);

    const hasKeys =
      apiKeys.openaiKey || apiKeys.anthropicKey || apiKeys.googleKey || apiKeys.groqKey || apiKeys.xaiKey;

    let useFallback = false;
    if (!hasKeys) {
      useFallback = true;
    }

    const mode = dto.mode || "council";
    const debateSource = dto.debateSource || "web";

    const effectiveModels = useFallback
      ? Array.from({ length: Math.max(dto.models.length, 2) }, () => FREE_FALLBACK_MODELS.debater)
      : dto.models;

    const estimated = this.estimateCost(dto.topic, effectiveModels, mode);

    let conversationId = dto.conversationId;
    if (!conversationId) {
      const conversation = await this.prisma.conversationV2.create({
        data: {
          userId: user.id,
          title: dto.topic.slice(0, 100),
        },
      });
      conversationId = conversation.id;
    }

    const debate = await this.prisma.debateSession.create({
      data: {
        userId: user.id,
        topic: dto.topic,
        status: "pending",
        modelsUsed: effectiveModels,
        totalCost: 0,
        mode,
        debateSource,
        estimatedCost: estimated.estimatedCost,
        conversationId,
        ...(dto.projectContext && { projectContext: dto.projectContext }),
      },
    });

    let systemPrompt: string | undefined;
    if (dto.personaId) {
      const persona = await this.personasService.findOne(dto.personaId, userId);
      systemPrompt = persona.systemPrompt;
    }

    try {
      await this.aiWorkersClient.startDebate({
        debateId: debate.id,
        topic: dto.topic,
        models: effectiveModels,
        apiKeys: {
          openaiKey: apiKeys.openaiKey,
          anthropicKey: apiKeys.anthropicKey,
          googleKey: apiKeys.googleKey,
          groqKey: apiKeys.groqKey,
          xaiKey: apiKeys.xaiKey,
        },
        systemPrompt,
        mode,
        debateSource,
        projectContext: dto.projectContext,
      });

      await this.updateStatus(debate.id, "processing");
    } catch (error) {
      await this.updateStatus(debate.id, "failed");
      throw error;
    }

    return debate;
  }

  async findAll(clerkId: string, limit: number = 20, offset: number = 0, search?: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return [];
    }

    const where: Record<string, unknown> = { userId: user.id };
    if (search && search.trim()) {
      where.topic = { contains: search.trim(), mode: "insensitive" };
    }

    return this.prisma.debateSession.findMany({
      where,
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

  async findOne(id: string, clerkId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const debate = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
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

  async findConversationDebates(conversationId: string, clerkId: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return [];
    }

    return this.prisma.debateSession.findMany({
      where: { conversationId, userId: user.id },
      orderBy: { createdAt: "asc" },
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
  }

  async renameDebate(id: string, clerkId: string, newTopic: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const debate = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!debate) {
      throw new NotFoundException("Debate session not found");
    }

    return this.prisma.debateSession.update({
      where: { id },
      data: { topic: newTopic },
    });
  }

  async archiveDebate(id: string, clerkId: string, archived: boolean): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const debate = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!debate) {
      throw new NotFoundException("Debate session not found");
    }

    return this.prisma.debateSession.update({
      where: { id },
      data: { status: archived ? "archived" : "completed" },
    });
  }

  async updateStatus(id: string, status: DebateStatus, goldenPrompt?: string): Promise<any> {
    return this.prisma.debateSession.update({
      where: { id },
      data: {
        status,
        ...(goldenPrompt && { goldenPrompt }),
      },
    });
  }

  async addRound(sessionId: string, roundNumber: number) {
    return this.prisma.debateRound.create({
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
    return this.prisma.debateMessage.create({
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

  async deleteDebate(id: string, clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const debate = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!debate) {
      throw new NotFoundException("Debate session not found");
    }

    await this.prisma.debateSession.update({
      where: { id },
      data: { status: "deleted" },
    });

    return { id, deleted: true };
  }

  async retryDebate(id: string, clerkId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const debate = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!debate) {
      throw new NotFoundException("Debate session not found");
    }

    if (debate.status !== "failed") {
      throw new BadRequestException("Only failed debates can be retried");
    }

    await this.updateStatus(id, "pending");

    const apiKeys = await this.apiKeysService.getUserApiKeys(clerkId);

    try {
      await this.aiWorkersClient.startDebate({
        debateId: id,
        topic: debate.topic,
        models: debate.modelsUsed as string[],
        apiKeys: {
          openaiKey: apiKeys.openaiKey,
          anthropicKey: apiKeys.anthropicKey,
          googleKey: apiKeys.googleKey,
          groqKey: apiKeys.groqKey,
          xaiKey: apiKeys.xaiKey,
        },
      });

      await this.updateStatus(id, "processing");
    } catch (error) {
      await this.updateStatus(id, "failed");
      throw error;
    }

    return this.prisma.debateSession.findUnique({
      where: { id },
    });
  }

  async updateTotalCost(sessionId: string, cost: number): Promise<any> {
    return this.prisma.debateSession.update({
      where: { id: sessionId },
      data: { totalCost: { increment: cost } },
    });
  }

  async cancelDebate(id: string, clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const debate = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!debate) {
      throw new NotFoundException("Debate session not found");
    }

    if (debate.status !== "pending" && debate.status !== "processing") {
      throw new BadRequestException("Only active debates can be cancelled");
    }

    await this.updateStatus(id, "cancelled");

    try {
      if (this.redis.status === "ready") {
        await this.redis.publish(`debate:${id}:cancel`, JSON.stringify({ debateId: id, action: "cancel" }));
      }
    } catch (_) {}

    return { id, cancelled: true };
  }

  estimateCost(topic: string, models: string[], mode: string) {
    const modeRoundMap: Record<string, number> = {
      quick: 1,
      council: 3,
      deep: 5,
      blind: 3,
    };

    const rounds = modeRoundMap[mode] || 3;
    const avgInputTokens = Math.min(topic.length * 2, 2000);
    const avgOutputTokens = 800;

    const breakdown: Array<{ model: string; role: string; estimatedCost: number }> = [];
    let total = 0;

    for (const model of models) {
      const pricing = MODEL_PRICING[model] || MODEL_PRICING["default"];
      const modelCost =
        rounds * ((avgInputTokens / 1_000_000) * pricing.inputPerMillion + (avgOutputTokens / 1_000_000) * pricing.outputPerMillion);
      breakdown.push({ model, role: "debater", estimatedCost: parseFloat(modelCost.toFixed(6)) });
      total += modelCost;
    }

    const judgePricing = MODEL_PRICING["gpt-4o-mini"] || MODEL_PRICING["default"];
    const judgeCost = (avgInputTokens * models.length / 1_000_000) * judgePricing.inputPerMillion +
      (avgOutputTokens / 1_000_000) * judgePricing.outputPerMillion;
    breakdown.push({ model: "gpt-4o-mini", role: "judge", estimatedCost: parseFloat(judgeCost.toFixed(6)) });
    total += judgeCost;

    return {
      estimatedCost: parseFloat(total.toFixed(6)),
      breakdown,
      rounds,
      mode,
    };
  }
}

