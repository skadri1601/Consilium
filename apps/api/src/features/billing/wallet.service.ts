import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../shared/database";

// Wallet / WalletTransaction models are not yet in the Prisma schema; this
// feature is half-implemented. The cast lets the rest of the monorepo
// type-check while the schema catches up (tracked as a separate task).
type AnyPrisma = PrismaService & Record<string, any>;

@Injectable()
export class WalletService {
  constructor(private readonly prismaBase: PrismaService) {}

  private get prisma(): AnyPrisma {
    return this.prismaBase as AnyPrisma;
  }

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({ data: { userId } });
    }
    return wallet;
  }

  async getBalance(
    userId: string,
  ): Promise<{ balanceCents: number; currency: string }> {
    const wallet = await this.getOrCreateWallet(userId);
    return { balanceCents: wallet.balanceCents, currency: wallet.currency };
  }

  async credit(
    userId: string,
    amountCents: number,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (amountCents <= 0)
      throw new BadRequestException("Credit amount must be positive");
    const wallet = await this.getOrCreateWallet(userId);
    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balanceCents: { increment: amountCents } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amountCents,
          description,
          metadata: metadata as any,
        },
      }),
    ]);
  }

  async debit(params: {
    userId: string;
    amountCents: number;
    description: string;
    provider?: string;
    modelId?: string;
    debateId?: string;
  }): Promise<void> {
    const { userId, amountCents, description, provider, modelId, debateId } =
      params;
    if (amountCents <= 0) return;

    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balanceCents < amountCents) {
      throw new BadRequestException("Insufficient wallet balance");
    }

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balanceCents: { decrement: amountCents } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amountCents,
          description,
          provider,
          modelId,
          debateId,
        },
      }),
    ]);
  }

  async getTransactions(userId: string, limit = 20, offset = 0) {
    const wallet = await this.getOrCreateWallet(userId);
    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async creditFromStripePayment(
    userId: string,
    amountCents: number,
    stripePaymentIntentId: string,
  ): Promise<void> {
    const wallet = await this.getOrCreateWallet(userId);
    const existing = await this.prisma.walletTransaction.findFirst({
      where: { stripePaymentIntentId },
    });
    if (existing) return;

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balanceCents: { increment: amountCents } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amountCents,
          description: "Wallet top-up via Stripe",
          stripePaymentIntentId,
        },
      }),
    ]);
  }
}
