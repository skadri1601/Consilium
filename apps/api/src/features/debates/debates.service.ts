import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
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
import { MODEL_PRICING, FREE_FALLBACK_MODELS } from "./model-pricing";
import { DebateQueueService } from "../../shared/queue/debate-queue.service";
import type { DebateSession } from "@consilium/database";

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
  constructor(
    private prisma: PrismaService,
    private apiKeysService: ApiKeysService,
    private aiWorkersClient: AiWorkersClient,
    private personasService: PersonasService,
    private configService: ConfigService,
    @Inject(forwardRef(() => DebateQueueService))
    private debateQueueService: DebateQueueService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private async _prepareDebate(
    userId: string,
    dto: CreateDebateDto,
  ): Promise<PreparedDebate> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException(
        "User not found. Please ensure your account is synced.",
      );
    }

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
        ...(goldenPrompt && { goldenPrompt }),
      },
    });
  }

  async completeDebate(
    id: string,
    result: {
      goldenPrompt?: string;
      totalCost?: number;
      synthesisMethod?: string;
      judgeModel?: string;
      improvementScore?: number;
    },
  ): Promise<DebateSession> {
    return this.prisma.debateSession.update({
      where: { id },
      data: {
        status: 'completed',
        ...(result.goldenPrompt !== undefined && { goldenPrompt: result.goldenPrompt }),
        ...(result.totalCost !== undefined && { totalCost: result.totalCost }),
        ...(result.synthesisMethod !== undefined && { synthesisMethod: result.synthesisMethod }),
        ...(result.judgeModel !== undefined && { judgeModel: result.judgeModel }),
        ...(result.improvementScore !== undefined && { improvementScore: result.improvementScore }),
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

  recommendModels(topic: string, budget: "free" | "balanced" | "premium") {
    const lower = topic.toLowerCase();

    const isCoding = /\b(code|bug|function|api|typescript|python|javascript|error|stack trace|algorithm|database|sql|schema)\b/.test(lower);
    const isData = /\b(data|analytics|statistics|ml|machine learning|model|dataset|csv|analysis)\b/.test(lower);
    const isCreative = /\b(design|creative|write|story|marketing|content|brand|ux|ui)\b/.test(lower);
    const isScience = /\b(research|study|hypothesis|experiment|paper|evidence|biology|chemistry|physics)\b/.test(lower);
    const isBusiness = /\b(strategy|revenue|market|customer|business|product|startup|growth|pricing)\b/.test(lower);

    let recommended: string[];
    let reasoning: string;
    let estimatedCostCents: number;

    if (budget === "free") {
      recommended = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
      reasoning = "Free Groq-hosted models for zero-cost debates";
      estimatedCostCents = 0;
    } else if (budget === "balanced") {
      if (isCoding) {
        recommended = ["claude-sonnet-4-6", "gpt-4o", "gemini-2.0-flash"];
        reasoning = "Strong coding models with complementary strengths";
      } else if (isData || isScience) {
        recommended = ["gemini-2.5-pro", "claude-sonnet-4-6", "gpt-4o"];
        reasoning = "Data and science reasoning specialists";
      } else if (isCreative) {
        recommended = ["claude-sonnet-4-6", "gpt-4o", "grok-2-1212"];
        reasoning = "Creative writing and content generation specialists";
      } else if (isBusiness) {
        recommended = ["claude-sonnet-4-6", "gpt-4o", "gemini-2.0-flash"];
        reasoning = "Business analysis with broad context handling";
      } else {
        recommended = ["claude-sonnet-4-6", "gpt-4o", "gemini-2.0-flash"];
        reasoning = "Well-rounded balanced model panel";
      }
      estimatedCostCents = 10;
    } else {
      if (isCoding) {
        recommended = ["claude-opus-4-6", "gpt-4o", "gemini-2.5-pro", "claude-sonnet-4-6"];
        reasoning = "Top-tier coding models for maximum accuracy";
      } else if (isScience || isData) {
        recommended = ["gemini-2.5-pro", "claude-opus-4-6", "gpt-4o", "claude-sonnet-4-6"];
        reasoning = "Premium science and data reasoning ensemble";
      } else if (isBusiness) {
        recommended = ["claude-opus-4-6", "gpt-4o", "grok-2-1212", "gemini-2.5-pro"];
        reasoning = "Strategic business analysis with diverse perspectives";
      } else {
        recommended = ["claude-opus-4-6", "gpt-4o", "gemini-2.5-pro", "claude-sonnet-4-6"];
        reasoning = "Best-in-class premium model ensemble";
      }
      estimatedCostCents = 30;
    }

    return { recommended, reasoning, budget, estimatedCostCents };
  }

  async createComparisonDebate(
    userId: string,
    optionA: string,
    optionB: string,
    context?: string,
    models?: string[],
  ) {
    const contextClause = context ? ` Context: ${context}.` : "";
    const topic = `Compare and contrast: ${optionA} vs ${optionB}.${contextClause} Provide a structured analysis covering: advantages, disadvantages, use cases, performance, maintainability, and a clear recommendation.`;

    const effectiveModels = models && models.length >= 2
      ? models
      : ["claude-sonnet-4-6", "gpt-4o", "gemini-2.0-flash"];

    return this.createDebate(userId, {
      topic,
      models: effectiveModels,
      mode: "council",
      debateSource: "web",
    });
  }

  async replayDebate(id: string, clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const original = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!original) {
      throw new NotFoundException("Debate session not found");
    }

    return this.createDebate(clerkId, {
      topic: original.topic,
      models: original.modelsUsed as string[],
      mode: (original.mode as string) || "council",
      debateSource: (original.debateSource as string) || "web",
    });
  }

  async getExport(id: string, format: string, clerkId: string): Promise<{ content: string; contentType: string; filename: string }> {
    const debate = await this.findOne(id, clerkId);

    if (format === 'json') {
      return {
        content: JSON.stringify(debate, null, 2),
        contentType: 'application/json',
        filename: `debate-${id}.json`,
      };
    }

    const date = new Date(debate.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const models = (debate.modelsUsed as string[]).join(', ');

    const roundSections = debate.rounds
      .map((round) => {
        const roundTitle = round.roundNumber === 1
          ? 'Round 1: Independent Analysis'
          : round.roundNumber === 2
          ? 'Round 2: Cross-Examination'
          : `Round ${round.roundNumber}: Rebuttal & Refinement`;

        const messages = round.messages
          .map((msg) => `### ${msg.modelUsed}\n${msg.content}`)
          .join('\n\n');

        return `## ${roundTitle}\n\n${messages}`;
      })
      .join('\n\n---\n\n');

    const consensusSection = debate.goldenPrompt
      ? `## Consensus\n\n${debate.goldenPrompt}`
      : '';

    const content = [
      `# ${debate.topic}`,
      ``,
      `> Debate ID: ${debate.id} | Mode: ${debate.mode ?? 'council'} | Date: ${date}`,
      `> Models: ${models}`,
      ``,
      consensusSection,
      roundSections,
      ``,
      `---`,
      `*Generated by Consilium — myconsilium.xyz*`,
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    return {
      content,
      contentType: 'text/markdown',
      filename: `debate-${id}.md`,
    };
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

    const judgePricing =
      MODEL_PRICING["gpt-4o-mini"] || MODEL_PRICING["default"];
    const judgeCost =
      ((avgInputTokens * models.length) / 1_000_000) *
        judgePricing.inputPerMillion +
      (avgOutputTokens / 1_000_000) * judgePricing.outputPerMillion;
    breakdown.push({
      model: "gpt-4o-mini",
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
