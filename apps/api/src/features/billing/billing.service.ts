import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/database";
import { StripeService } from "./stripe.service";
import { WalletService } from "./wallet.service";
import { UsageService } from "./usage.service";
import { PlansService, SubscriptionTier } from "./plans.service";
import Stripe from "stripe";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly wallet: WalletService,
    private readonly usage: UsageService,
    private readonly plans: PlansService,
  ) {}

  async getOrCreateSubscription(userId: string) {
    let sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) {
      sub = await this.prisma.subscription.create({
        data: { userId, tier: "FREE", status: "ACTIVE" },
      });
    }
    return sub;
  }

  async getSubscriptionWithDetails(userId: string) {
    const sub = await this.getOrCreateSubscription(userId);
    const wallet = await this.wallet.getBalance(userId);
    const usageSummary = await this.usage.getUsageSummary(userId);
    const invoices = sub.stripeCustomerId
      ? await this.stripe.listInvoices(sub.stripeCustomerId, 5)
      : [];

    return {
      subscription: sub,
      wallet,
      usage: usageSummary,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        status: inv.status,
        created: inv.created,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
      })),
    };
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    tier: SubscriptionTier,
    baseUrl: string,
  ): Promise<string> {
    if (tier === "FREE")
      throw new BadRequestException("Cannot checkout for FREE tier");

    const priceId = this.plans.getStripePriceId(tier);
    if (!priceId)
      throw new BadRequestException(`No price configured for ${tier} tier`);

    let sub = await this.getOrCreateSubscription(userId);
    let customerId = sub.stripeCustomerId;

    if (!customerId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      customerId = await this.stripe.createCustomer(
        email,
        user
          ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
          : undefined,
        { userId },
      );
      if (customerId) {
        await this.prisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    if (!customerId) {
      throw new BadRequestException(
        "Stripe is not enabled or customer creation failed",
      );
    }

    const sessionUrl = await this.stripe.createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${baseUrl}/dashboard/billing?success=true`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
      metadata: { userId, tier },
      trialDays: 14,
    });

    if (!sessionUrl)
      throw new BadRequestException("Failed to create checkout session");
    return sessionUrl;
  }

  async createWalletTopUp(
    userId: string,
    amountCents: number,
    email: string,
    baseUrl: string,
  ): Promise<string> {
    const validAmounts = [500, 1000, 2500, 5000, 10000, 50000];
    if (!validAmounts.includes(amountCents)) {
      throw new BadRequestException("Invalid top-up amount");
    }

    const sub = await this.getOrCreateSubscription(userId);
    let customerId = sub.stripeCustomerId;

    if (!customerId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      customerId = await this.stripe.createCustomer(
        email,
        user
          ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
          : undefined,
        { userId },
      );
      if (customerId) {
        await this.prisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    if (!customerId) throw new BadRequestException("Stripe is not enabled");

    const sessionUrl = await this.stripe.createWalletTopUpSession({
      customerId,
      amountCents,
      successUrl: `${baseUrl}/dashboard/billing?wallet_success=true`,
      cancelUrl: `${baseUrl}/dashboard/billing`,
      userId,
    });

    if (!sessionUrl)
      throw new BadRequestException("Failed to create wallet top-up session");
    return sessionUrl;
  }

  async createPortalSession(userId: string, baseUrl: string): Promise<string> {
    const sub = await this.getOrCreateSubscription(userId);
    if (!sub.stripeCustomerId)
      throw new BadRequestException("No Stripe customer found");

    const url = await this.stripe.createCustomerPortalSession(
      sub.stripeCustomerId,
      `${baseUrl}/dashboard/billing`,
    );
    if (!url) throw new BadRequestException("Failed to create portal session");
    return url;
  }

  async cancelSubscription(userId: string): Promise<void> {
    const sub = await this.getOrCreateSubscription(userId);
    if (!sub.stripeSubscriptionId)
      throw new BadRequestException("No active subscription");

    const success = await this.stripe.cancelSubscription(
      sub.stripeSubscriptionId,
    );
    if (success) {
      await this.prisma.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: true },
      });
    }
  }

  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = await this.stripe.constructWebhookEvent(payload, signature);
    if (!event) return;

    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) return;

    if (
      session.mode === "payment" &&
      session.metadata?.type === "wallet_topup"
    ) {
      const amountCents = parseInt(session.metadata.amountCents || "0", 10);
      if (amountCents > 0 && session.payment_intent) {
        await this.wallet.creditFromStripePayment(
          userId,
          amountCents,
          String(session.payment_intent),
        );
      }
      return;
    }

    if (session.mode === "subscription" && session.subscription) {
      const stripeSubscription = await this.stripe.getSubscription(
        String(session.subscription),
      );
      if (!stripeSubscription) return;

      const tier = (session.metadata?.tier as SubscriptionTier) ?? "FREE";
      await this.prisma.subscription.update({
        where: { userId },
        data: {
          tier,
          status: "ACTIVE",
          stripeSubscriptionId: String(session.subscription),
          stripePriceId: stripeSubscription.items.data[0]?.price.id,
          currentPeriodStart: new Date(
            stripeSubscription.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            stripeSubscription.current_period_end * 1000,
          ),
          trialEnd: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : null,
        },
      });
    }
  }

  private async handleSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!sub) return;

    const statusMap: Record<string, string> = {
      active: "ACTIVE",
      canceled: "CANCELED",
      past_due: "PAST_DUE",
      trialing: "TRIALING",
      incomplete: "INCOMPLETE",
      paused: "PAUSED",
    };

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: stripeSubscription.id },
      data: {
        status: statusMap[stripeSubscription.status] ?? "ACTIVE",
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
      },
    });
  }

  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: stripeSubscription.id },
      data: {
        tier: "FREE",
        status: "CANCELED",
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: String(invoice.subscription) },
      data: { status: "PAST_DUE" },
    });
  }
}
