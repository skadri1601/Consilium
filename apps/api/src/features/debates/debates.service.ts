import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreateDebateDto } from "./dto/create-debate.dto";
import { DebateStatus } from "./debate-status";
import { DEBATE_MODES } from "@consilium/shared";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { AiWorkersClient } from "./ai-workers.client";
import { PersonasService } from "../personas/personas.service";
import { AuthService } from "../auth/auth.service";
import { MODEL_PRICING, FREE_FALLBACK_MODELS } from "./model-pricing";
import { DebateQueueService } from "../../shared/queue/debate-queue.service";
import type { DebateSession, User } from "@consilium/database";

interface ResolvedApiKeys {
  openaiKey?: string;
  anthropicKey?: string;
  googleKey?: string;
  groqKey?: string;
  xaiKey?: string;
}

interface PreparedDebate {
  user: { id: string; clerkId: string };
  apiKeys: ResolvedApiKeys;
  effectiveModels: string[];
  mode: string;
  debateSource: string;
  debate: DebateSession;
}

@Injectable()
export class DebatesService {
  private readonly logger = new Logger(DebatesService.name);

  constructor(
    private prisma: PrismaService,
    private apiKeysService: ApiKeysService,
    private aiWorkersClient: AiWorkersClient,
    private personasService: PersonasService,
    private configService: ConfigService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => DebateQueueService))
    private debateQueueService: DebateQueueService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private async resolveUser(clerkId: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { clerkId },
    });
    if (existing) return existing;

    this.logger.warn(
      `User row missing for clerkId=${clerkId}; attempting inline self-heal.`,
    );

    const clerkUser = await this.authService.getUser(clerkId);
    if (!clerkUser) {
      this.logger.error(
        `Self-heal failed: Clerk getUser(${clerkId}) returned null. Token verifies but Clerk user lookup is failing — verify CLERK_SECRET_KEY.`,
      );
      throw new NotFoundException(
        "User not found. Please ensure your account is synced.",
      );
    }

    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress || `${clerkId}@clerk.local`;
    const created = await this.prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email,
        firstName: clerkUser.firstName ?? undefined,
        lastName: clerkUser.lastName ?? undefined,
        imageUrl: clerkUser.imageUrl ?? undefined,
        tenantId: clerkId,
      },
      update: {},
    });
    this.logger.log(`Self-healed user row for clerkId=${clerkId}`);
    return created;
  }

  private async _prepareDebate(
    userId: string,
    dto: CreateDebateDto,
  ): Promise<PreparedDebate> {
    const user = await this.resolveUser(userId);

    const apiKeys = await this.apiKeysService.getUserApiKeys(userId);

    const hasKeys =
      apiKeys.openaiKey ||
      apiKeys.anthropicKey ||
      apiKeys.googleKey ||
      apiKeys.groqKey ||
      apiKeys.xaiKey;

    const mode = dto.mode || "council";
    const debateSource = dto.debateSource || "web";

    const effectiveModels = !hasKeys
      ? Array.from(
          { length: Math.max(dto.models.length, 2) },
          () => FREE_FALLBACK_MODELS.debater,
        )
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

    return {
      user,
      apiKeys: {
        openaiKey: apiKeys.openaiKey,
        anthropicKey: apiKeys.anthropicKey,
        googleKey: apiKeys.googleKey,
        groqKey: apiKeys.groqKey,
        xaiKey: apiKeys.xaiKey,
      },
      effectiveModels,
      mode,
      debateSource,
      debate,
    };
  }

  async createDebate(
    userId: string,
    dto: CreateDebateDto,
  ): Promise<DebateSession> {
    if (this.configService.get<boolean>("app.debateUseQueue")) {
      return this.createDebateViaQueue(userId, dto);
    }

    const { apiKeys, effectiveModels, mode, debateSource, debate } =
      await this._prepareDebate(userId, dto);

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
        apiKeys,
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

  async createDebateViaQueue(
    userId: string,
    dto: CreateDebateDto,
  ): Promise<DebateSession> {
    const { apiKeys, effectiveModels, mode, debateSource, debate } =
      await this._prepareDebate(userId, dto);

    let systemPrompt: string | undefined;
    if (dto.personaId) {
      const persona = await this.personasService.findOne(dto.personaId, userId);
      systemPrompt = persona.systemPrompt;
    }

    const job = await this.debateQueueService.addDebateJob({
      debateId: debate.id,
      topic: dto.topic,
      models: effectiveModels,
      userId,
      mode,
      debateSource,
      systemPrompt,
      projectContext: dto.projectContext as
        | Record<string, unknown>
        | undefined,
      apiKeys,
    });

    const queueJobId = job.id != null ? String(job.id) : debate.id;

    await this.prisma.debateSession.update({
      where: { id: debate.id },
      data: { queueJobId },
    });

    return this.prisma.debateSession.findUniqueOrThrow({
      where: { id: debate.id },
    });
  }

  async findAll(
    clerkId: string,
    limit: number = 20,
    offset: number = 0,
    search?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return [];
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      status: { notIn: ["deleted", "cancelled"] },
    };
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

  async findOne(id: string, clerkId: string) {
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

  async findConversationDebates(conversationId: string, clerkId: string) {
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

  async renameDebate(
    id: string,
    clerkId: string,
    newTopic: string,
  ): Promise<DebateSession> {
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

  async archiveDebate(
    id: string,
    clerkId: string,
    archived: boolean,
  ): Promise<DebateSession> {
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

  async updateStatus(
    id: string,
    status: DebateStatus,
    goldenPrompt?: string,
  ): Promise<DebateSession> {
    return this.prisma.debateSession.update({
      where: { id },
      data: {
        status,
        ...(goldenPrompt !== undefined && { goldenPrompt }),
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

  async retryDebate(
    id: string,
    clerkId: string,
  ): Promise<DebateSession | null> {
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
        mode: (debate.mode as string) || "council",
        debateSource: (debate.debateSource as string) || "web",
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

  async updateTotalCost(
    sessionId: string,
    cost: number,
  ): Promise<DebateSession> {
    return this.prisma.debateSession.update({
      where: { id: sessionId },
      data: { totalCost: { increment: cost } },
    });
  }

  async recordUsage(
    sessionId: string,
    tokens: number,
    cost: number,
  ): Promise<void> {
    if (!Number.isFinite(tokens) || !Number.isFinite(cost)) return;
    if (tokens <= 0 && cost <= 0) return;

    const debate = await this.prisma.debateSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });
    if (!debate) return;

    const user = await this.prisma.user.findUnique({
      where: { id: debate.userId },
      select: { tenantId: true },
    });
    if (!user) return;

    await this.prisma.usageRecord.create({
      data: {
        tenantId: user.tenantId,
        tokens: Math.max(0, Math.round(tokens)),
        cost: Math.max(0, cost),
      },
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
        await this.redis.publish(
          `debate:${id}:cancel`,
          JSON.stringify({ debateId: id, action: "cancel" }),
        );
      }
    } catch {
      // Best-effort cancellation — ignore errors
    }

    return { id, cancelled: true };
  }

  estimateCost(topic: string, models: string[], mode: string) {
    const rounds =
      (DEBATE_MODES as Record<string, { rounds: number }>)[mode]?.rounds || 3;
    const avgInputTokens = Math.min(topic.length * 2, 2000);
    const avgOutputTokens = 800;

    const breakdown: Array<{
      model: string;
      role: string;
      estimatedCost: number;
    }> = [];
    let total = 0;

    for (const model of models) {
      const pricing = MODEL_PRICING[model] || MODEL_PRICING["default"];
      const modelCost =
        rounds *
        ((avgInputTokens / 1_000_000) * pricing.inputPerMillion +
          (avgOutputTokens / 1_000_000) * pricing.outputPerMillion);
      breakdown.push({
        model,
        role: "debater",
        estimatedCost: parseFloat(modelCost.toFixed(6)),
      });
      total += modelCost;
    }

    const judgeModel = "gpt-5.4-mini";
    const judgePricing =
      MODEL_PRICING[judgeModel] || MODEL_PRICING["default"];
    const judgeCost =
      ((avgInputTokens * models.length) / 1_000_000) *
        judgePricing.inputPerMillion +
      (avgOutputTokens / 1_000_000) * judgePricing.outputPerMillion;
    breakdown.push({
      model: judgeModel,
      role: "judge",
      estimatedCost: parseFloat(judgeCost.toFixed(6)),
    });
    total += judgeCost;

    return {
      estimatedCost: parseFloat(total.toFixed(6)),
      breakdown,
      rounds,
      mode,
    };
  }
}
