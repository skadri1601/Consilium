import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalDebates, debatesThisMonth, totalCostResult, costThisMonthResult] = await Promise.all([
      (this.prisma as any).debateSession.count({ where: { userId } }),
      (this.prisma as any).debateSession.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      (this.prisma as any).debateSession.aggregate({
        where: { userId },
        _sum: { totalCost: true },
      }),
      (this.prisma as any).debateSession.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalCost: true },
      }),
    ]);

    // Get debates by day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDebates = await (this.prisma as any).debateSession.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const debatesByDay = recentDebates.reduce(
      (acc: Record<string, number>, debate: { createdAt: Date }) => {
        const date = new Date(debate.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get model usage
    const allDebates = await (this.prisma as any).debateSession.findMany({
      where: { userId },
      select: { modelsUsed: true },
    });

    const modelUsage = allDebates.reduce(
      (acc: Record<string, number>, debate: { modelsUsed: unknown }) => {
        const models = debate.modelsUsed as string[];
        models.forEach((model) => {
          acc[model] = (acc[model] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalDebates,
      totalCost: totalCostResult._sum.totalCost || 0,
      debatesThisMonth,
      costThisMonth: costThisMonthResult._sum.totalCost || 0,
      debatesByDay: Object.entries(debatesByDay).map(([date, count]) => ({ date, count })),
      modelUsage: Object.entries(modelUsage).map(([model, count]) => ({ model, count })),
    };
  }

  async getUsageHistory(tenantId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await (this.prisma as any).usageRecord.findMany({
      where: {
        tenantId,
        recordedAt: { gte: startDate },
      },
      orderBy: { recordedAt: "asc" },
    });

    return records;
  }

  async getCostsByModel(tenantId: string) {
    const costs = await (this.prisma as any).usageRecord.groupBy({
      by: ["agentId"],
      where: { tenantId },
      _sum: { cost: true, tokens: true },
    });

    return costs.reduce(
      (acc: Record<string, number>, curr: { agentId: string | null; _sum: { cost: number | null } }) => {
        if (curr.agentId) {
          acc[curr.agentId] = curr._sum.cost || 0;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }
}
