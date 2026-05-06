import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";

interface Decision {
  category: string;
  statement: string;
  status: "decided" | "tentative" | "open";
  debateId: string;
  debateIndex: number;
}

@Injectable()
export class ConversationV2Service {
  private readonly logger = new Logger(ConversationV2Service.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, title: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.conversationV2.create({
      data: {
        userId: user.id,
        title: title || "New Conversation",
      },
    });
  }

  async list(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return [];
    }

    return this.prisma.conversationV2.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        debates: {
          select: {
            id: true,
            topic: true,
            status: true,
            mode: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async get(id: string, userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const conversation = await this.prisma.conversationV2.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: {
        debates: {
          include: {
            rounds: {
              include: { messages: true },
              orderBy: { roundNumber: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    return conversation;
  }

  async delete(id: string, userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const conversation = await this.prisma.conversationV2.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    return this.prisma.conversationV2.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addDebate(
    conversationId: string,
    debateId: string,
    userId: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const conversation = await this.prisma.conversationV2.findFirst({
      where: { id: conversationId, userId: user.id, deletedAt: null },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    return this.prisma.debateSession.update({
      where: { id: debateId },
      data: { conversationId },
    });
  }

  async extractAndUpdateDecisionLog(
    debateId: string,
    goldenPrompt: string,
  ): Promise<void> {
    const debate = await this.prisma.debateSession.findUnique({
      where: { id: debateId },
      select: { conversationId: true },
    });

    if (!debate?.conversationId) return;

    const conversation = await this.prisma.conversationV2.findUnique({
      where: { id: debate.conversationId },
      include: {
        debates: {
          select: { id: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) return;

    const debateIndex = conversation.debates.findIndex(
      (d: { id: string }) => d.id === debateId,
    );

    const newDecisions = this.extractDecisions(
      goldenPrompt,
      debateId,
      debateIndex >= 0 ? debateIndex : conversation.debates.length,
    );

    const existing = (conversation.decisionLog as Decision[] | null) || [];
    const merged = this.mergeDecisions(existing, newDecisions);

    try {
      await this.prisma.conversationV2.update({
        where: { id: debate.conversationId },
        data: { decisionLog: merged as any },
      });
    } catch (err) {
      this.logger.warn(`Failed to update decision log: ${err}`);
    }
  }

  private extractDecisions(
    goldenPrompt: string,
    debateId: string,
    debateIndex: number,
  ): Decision[] {
    const decisions: Decision[] = [];
    const lines = goldenPrompt.split("\n");

    const decisionPatterns = [
      /(?:^|\s)(?:decided|decision|recommend|should|must|use|adopt|implement|choose|go with|prefer)\s*:?\s*(.+)/i,
      /^\s*[-*]\s*\*?\*?(?:decision|recommendation|action item|conclusion)\*?\*?\s*:?\s*(.+)/i,
    ];

    const categoryPatterns: [RegExp, string][] = [
      [/\b(?:auth|login|session|jwt|oauth)\b/i, "AUTH"],
      [/\b(?:database|db|postgres|mysql|sql|prisma|schema)\b/i, "DATABASE"],
      [/\b(?:api|endpoint|route|rest|graphql)\b/i, "API"],
      [/\b(?:cache|redis|memcache)\b/i, "CACHING"],
      [/\b(?:deploy|ci|cd|docker|kubernetes)\b/i, "DEPLOYMENT"],
      [/\b(?:test|testing|jest|vitest|pytest)\b/i, "TESTING"],
      [/\b(?:security|encrypt|vulnerability|csrf|xss)\b/i, "SECURITY"],
      [/\b(?:architecture|pattern|design|structure)\b/i, "ARCHITECTURE"],
    ];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 15) continue;

      for (const pattern of decisionPatterns) {
        const match = trimmed.match(pattern);
        if (!match) continue;

        const statement = (match[1] || trimmed).trim();
        if (statement.length < 10) continue;

        let category = "GENERAL";
        for (const [catPattern, catName] of categoryPatterns) {
          if (catPattern.test(statement)) {
            category = catName;
            break;
          }
        }

        const hasHedge = /\b(?:maybe|perhaps|consider|might|could|possibly)\b/i.test(statement);

        decisions.push({
          category,
          statement: statement.slice(0, 300),
          status: hasHedge ? "tentative" : "decided",
          debateId,
          debateIndex,
        });
        break;
      }
    }

    const headers = lines.filter((l) => /^#{1,3}\s/.test(l.trim()));
    for (const header of headers) {
      const text = header.replace(/^#+\s*/, "").trim();
      if (/\b(?:open|unresolved|todo|question|tbd)\b/i.test(text)) {
        decisions.push({
          category: "GENERAL",
          statement: text.slice(0, 300),
          status: "open",
          debateId,
          debateIndex,
        });
      }
    }

    return decisions;
  }

  private mergeDecisions(
    existing: Decision[],
    incoming: Decision[],
  ): Decision[] {
    const merged = [...existing];

    for (const newDec of incoming) {
      const existingIdx = merged.findIndex(
        (d) =>
          d.category === newDec.category &&
          d.statement.toLowerCase().includes(
            newDec.statement.slice(0, 50).toLowerCase(),
          ),
      );

      if (existingIdx >= 0) {
        if (newDec.debateIndex > merged[existingIdx].debateIndex) {
          merged[existingIdx] = newDec;
        }
      } else {
        merged.push(newDec);
      }
    }

    return merged;
  }
}
