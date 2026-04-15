import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { PrismaService } from "../../shared/database/prisma.service";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { DeliberationEventsClient } from "./deliberation-events.client";
import { CreateDeliberationDto } from "./dto/create-deliberation.dto";
import { FREE_FALLBACK_MODELS } from "../debates/model-pricing";
import { Prisma } from "@consilium/database";

@Injectable()
export class DeliberationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeysService: ApiKeysService,
    private readonly eventsClient: DeliberationEventsClient,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async createDeliberation(
    userId: string,
    dto: CreateDeliberationDto,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException(
        "User not found. Please ensure your account is synced.",
      );
    }

    const storedKeys = await this.apiKeysService.getUserApiKeys(userId);
    const apiKeys = dto.apiKeys || {
      openaiKey: storedKeys.openaiKey,
      anthropicKey: storedKeys.anthropicKey,
      googleKey: storedKeys.googleKey,
      groqKey: storedKeys.groqKey,
      xaiKey: storedKeys.xaiKey,
    };

    const hasKeys =
      apiKeys.openaiKey ||
      apiKeys.anthropicKey ||
      apiKeys.googleKey ||
      apiKeys.groqKey ||
      apiKeys.xaiKey;

    const effectiveModels = hasKeys
      ? dto.models
      : Array.from(
          { length: Math.max(dto.models.length, 2) },
          () => FREE_FALLBACK_MODELS.debater,
        );

    const mode = dto.mode || "council";

    const conversation = await this.prisma.conversationV2.create({
      data: {
        userId: user.id,
        title: dto.topic.slice(0, 100),
      },
    });

    const mergedProjectContext: Record<string, unknown> = {};
    if (dto.responses !== undefined && dto.responses !== null) {
      mergedProjectContext.evalResponses = dto.responses;
    }
    if (dto.projectContext && typeof dto.projectContext === "object") {
      Object.assign(mergedProjectContext, dto.projectContext);
    }
    if (dto.context && typeof dto.context === "object") {
      Object.assign(mergedProjectContext, dto.context);
    }
    const projectContextValue =
      Object.keys(mergedProjectContext).length > 0
        ? (mergedProjectContext as Prisma.InputJsonValue)
        : undefined;

    const debateSource = dto.debateSource ?? "deliberation";

    const deliberation = await this.prisma.debateSession.create({
      data: {
        userId: user.id,
        topic: dto.topic,
        status: "pending",
        modelsUsed: effectiveModels,
        totalCost: 0,
        mode,
        debateSource,
        conversationId: conversation.id,
        projectContext: projectContextValue,
      },
    });

    try {
      await this.eventsClient.startDeliberation({
        deliberationId: deliberation.id,
        topic: dto.topic,
        mode,
        models: effectiveModels,
        maxRounds: dto.maxRounds,
        apiKeys: {
          openaiKey: apiKeys.openaiKey,
          anthropicKey: apiKeys.anthropicKey,
          googleKey: apiKeys.googleKey,
          groqKey: apiKeys.groqKey,
          xaiKey: apiKeys.xaiKey,
        },
      });

      await this.prisma.debateSession.update({
        where: { id: deliberation.id },
        data: { status: "processing" },
      });
    } catch (error) {
      await this.prisma.debateSession.update({
        where: { id: deliberation.id },
        data: { status: "failed" },
      });
      throw error;
    }

    return deliberation;
  }

  async createRedTeam(
    userId: string,
    dto: CreateDeliberationDto,
  ): Promise<any> {
    return this.createDeliberation(userId, { ...dto, mode: "redteam" });
  }

  async createBlindEval(
    userId: string,
    dto: CreateDeliberationDto,
  ): Promise<any> {
    return this.createDeliberation(userId, { ...dto, mode: "blind" });
  }

  async retryDeliberation(id: string, clerkId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const deliberation = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!deliberation) {
      throw new NotFoundException("Deliberation not found");
    }

    if (deliberation.status !== "failed") {
      throw new BadRequestException("Only failed deliberations can be retried");
    }

    await this.prisma.debateSession.update({
      where: { id },
      data: { status: "pending" },
    });

    const storedKeys = await this.apiKeysService.getUserApiKeys(clerkId);

    try {
      await this.eventsClient.startDeliberation({
        deliberationId: id,
        topic: deliberation.topic,
        mode: (deliberation.mode as string) || "council",
        models: deliberation.modelsUsed as string[],
        apiKeys: {
          openaiKey: storedKeys.openaiKey,
          anthropicKey: storedKeys.anthropicKey,
          googleKey: storedKeys.googleKey,
          groqKey: storedKeys.groqKey,
          xaiKey: storedKeys.xaiKey,
        },
      });

      await this.prisma.debateSession.update({
        where: { id },
        data: { status: "processing" },
      });
    } catch (error) {
      await this.prisma.debateSession.update({
        where: { id },
        data: { status: "failed" },
      });
      throw error;
    }

    return this.prisma.debateSession.findUnique({ where: { id } });
  }

  async getDeliberation(id: string, clerkId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const deliberation = await this.prisma.debateSession.findFirst({
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

    if (!deliberation) {
      throw new NotFoundException("Deliberation not found");
    }

    return deliberation;
  }

  async cancelDeliberation(id: string, clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const deliberation = await this.prisma.debateSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!deliberation) {
      throw new NotFoundException("Deliberation not found");
    }

    if (
      deliberation.status !== "pending" &&
      deliberation.status !== "processing"
    ) {
      throw new BadRequestException(
        "Only active deliberations can be cancelled",
      );
    }

    await this.prisma.debateSession.update({
      where: { id },
      data: { status: "cancelled" },
    });

    try {
      if (this.redis.status === "ready") {
        await this.redis.publish(
          `deliberation:${id}:cancel`,
          JSON.stringify({ deliberationId: id, action: "cancel" }),
        );
      }
    } catch {
      /* cancel publish may fail silently */
    }

    return { id, cancelled: true };
  }
}
