import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";

interface DigestData {
  weekDebates: number;
  totalCostUsd: number;
  uniqueModelsUsed: string[];
  topMode: string;
  topDebateTopic?: string;
  topDebateId?: string;
}

@Injectable()
export class DigestService {
  constructor(private readonly prisma: PrismaService) {}

  async generateUserDigest(userId: string): Promise<DigestData> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [debates, topicCounts] = await Promise.all([
      this.prisma.debateSession.findMany({
        where: { userId, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.debateSession.groupBy({
        by: ["mode"],
        where: { userId, createdAt: { gte: weekAgo } },
        _count: { id: true },
      }),
    ]);

    const totalCost = debates.reduce((sum, d) => sum + (d.totalCost ?? 0), 0);
    const uniqueModels = new Set(
      debates.flatMap((d) => (d.modelsUsed as string[]) ?? []),
    );
    const topDebate = debates.find((d) => d.goldenPrompt);

    return {
      weekDebates: debates.length,
      totalCostUsd: totalCost,
      uniqueModelsUsed: Array.from(uniqueModels),
      topMode:
        topicCounts.sort((a, b) => b._count.id - a._count.id)[0]?.mode ??
        "council",
      topDebateTopic: topDebate?.topic?.slice(0, 100),
      topDebateId: topDebate?.id,
    };
  }

  generateDigestHtml(digest: DigestData, userName?: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Weekly Consilium Digest</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #e5e5e5;">
  <div style="border-radius: 12px; border: 1px solid #262626; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">Your Weekly Consilium Digest</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Hi ${userName ?? "there"} — here's what the council debated</p>
    </div>
    <div style="padding: 32px; background: #111111;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px;">
        <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #818cf8;">${digest.weekDebates}</div>
          <div style="font-size: 12px; color: #737373;">Debates</div>
        </div>
        <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #818cf8;">${digest.uniqueModelsUsed.length}</div>
          <div style="font-size: 12px; color: #737373;">Models Used</div>
        </div>
        <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #818cf8;">$${digest.totalCostUsd.toFixed(2)}</div>
          <div style="font-size: 12px; color: #737373;">Total Cost</div>
        </div>
      </div>
      ${
        digest.topDebateTopic
          ? `
      <div style="background: #1a1a1a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px; font-size: 14px; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Debate of the Week</h3>
        <p style="margin: 0; font-size: 16px;">${digest.topDebateTopic}</p>
        <a href="https://myconsilium.xyz/debates/${digest.topDebateId}" style="display: inline-block; margin-top: 12px; color: #818cf8; text-decoration: none; font-size: 14px;">View Debate →</a>
      </div>`
          : ""
      }
      <div style="text-align: center; padding-top: 24px; border-top: 1px solid #262626;">
        <a href="https://myconsilium.xyz/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Open Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}
