import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../shared/database";
import { PlansService, SubscriptionTier } from "./plans.service";

@Injectable()
export class UsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
  ) {}

  async getCurrentPeriod(userId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const tier = (sub?.tier as SubscriptionTier) ?? "FREE";

    let period = await this.prisma.usagePeriod.findUnique({
      where: { userId_periodStart: { userId, periodStart } },
    });

    if (!period) {
      period = await this.prisma.usagePeriod.create({
        data: { userId, tier, periodStart, periodEnd },
      });
    }

    return period;
  }

  async getTodayDebateCount(userId: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.prisma.debateSession.count({
      where: { userId, createdAt: { gte: start, lte: end } },
    });
  }

  async checkDebateLimit(userId: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const tier = (sub?.tier as SubscriptionTier) ?? "FREE";
    const limits = this.plans.getLimits(tier);

    if (limits.debatesPerDay === -1) return;

    const todayCount = await this.getTodayDebateCount(userId);
    if (todayCount >= limits.debatesPerDay) {
      throw new ForbiddenException(
        `Daily debate limit reached (${limits.debatesPerDay}/day on ${tier} tier). Upgrade to get more.`,
      );
    }
  }

  async checkModelCountLimit(
    userId: string,
    requestedModelCount: number,
  ): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const tier = (sub?.tier as SubscriptionTier) ?? "FREE";
    const limits = this.plans.getLimits(tier);

    if (limits.modelsPerDebate === -1) return;

    if (requestedModelCount > limits.modelsPerDebate) {
      throw new ForbiddenException(
        `Model limit exceeded (max ${limits.modelsPerDebate} models on ${tier} tier). Upgrade to use more models.`,
      );
    }
  }

  async checkComputeCapacity(
    userId: string,
    estimatedCostCents: number,
  ): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const tier = (sub?.tier as SubscriptionTier) ?? "FREE";
    const limits = this.plans.getLimits(tier);

    if (limits.maxCostCentsPerMonth === 0) return;

    const period = await this.getCurrentPeriod(userId);
    if (
      period.costCentsUsed + estimatedCostCents >
      limits.maxCostCentsPerMonth
    ) {
      throw new ForbiddenException(
        `Monthly compute cap reached ($${(limits.maxCostCentsPerMonth / 100).toFixed(2)}/mo on ${tier} tier). Upgrade or top up your wallet.`,
      );
    }
  }

  async recordDebateUsage(params: {
    userId: string;
    debateId: string;
    modelsUsed: string[];
    inputTokens: number;
    outputTokens: number;
    isByok: boolean;
  }): Promise<void> {
    const { userId, modelsUsed, inputTokens, outputTokens, isByok } = params;

    let totalCostCents = 0;
    if (!isByok) {
      for (const modelId of modelsUsed) {
        totalCostCents += this.plans.calculateModelCostCents(
          modelId,
          inputTokens / modelsUsed.length,
          outputTokens / modelsUsed.length,
          true,
        );
      }
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    await this.prisma.usagePeriod.update({
      where: { userId_periodStart: { userId, periodStart } },
      data: {
        debatesCount: { increment: 1 },
        tokensUsed: { increment: inputTokens + outputTokens },
        costCentsUsed: { increment: totalCostCents },
      },
    });
  }

  async getUsageSummary(userId: string) {
    const period = await this.getCurrentPeriod(userId);
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const tier = (sub?.tier as SubscriptionTier) ?? "FREE";
    const limits = this.plans.getLimits(tier);
    const todayDebates = await this.getTodayDebateCount(userId);

    return {
      tier,
      period: {
        start: period.periodStart,
        end: period.periodEnd,
        debatesCount: period.debatesCount,
        tokensUsed: period.tokensUsed,
        costCentsUsed: period.costCentsUsed,
      },
      today: {
        debatesCount: todayDebates,
        limit: limits.debatesPerDay,
      },
      limits,
    };
  }
}
