import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const [totalQueries, totalTokens, totalCost] = await Promise.all([
      this.prisma.councilSession.count({ where: { tenantId } }),
      this.prisma.usageRecord.aggregate({
        where: { tenantId },
        _sum: { tokens: true },
      }),
      this.prisma.usageRecord.aggregate({
        where: { tenantId },
        _sum: { cost: true },
      }),
    ]);

    return {
      totalQueries,
      totalTokens: totalTokens._sum.tokens || 0,
      totalCost: totalCost._sum.cost || 0,
      avgLatency: 0, // TODO: Calculate from agent responses
      queriesThisMonth: 0,
      tokensThisMonth: 0,
      costThisMonth: 0,
    };
  }

  async getUsageHistory(tenantId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.prisma.usageRecord.findMany({
      where: {
        tenantId,
        recordedAt: { gte: startDate },
      },
      orderBy: { recordedAt: "asc" },
    });

    return records;
  }

  async getCostsByModel(tenantId: string) {
    const costs = await this.prisma.usageRecord.groupBy({
      by: ["agentId"],
      where: { tenantId },
      _sum: { cost: true, tokens: true },
    });

    return costs.reduce(
      (acc, curr) => {
        if (curr.agentId) {
          acc[curr.agentId] = curr._sum.cost || 0;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }
}
