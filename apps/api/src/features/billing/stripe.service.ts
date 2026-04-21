import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null = null;
  private readonly enabled: boolean;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    this.enabled =
      this.configService.get<string>("STRIPE_ENABLED") === "true" &&
      !!secretKey;
    if (this.enabled && secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>,
  ): Promise<string | null> {
    if (!this.stripe) return null;
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
      return customer.id;
    } catch (err) {
      this.logger.error("createCustomer failed", err);
      return null;
    }
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    trialDays?: number;
  }): Promise<string | null> {
    if (!this.stripe) return null;
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        mode: "subscription",
        line_items: [{ price: params.priceId, quantity: 1 }],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
        subscription_data: params.trialDays
          ? { trial_period_days: params.trialDays, metadata: params.metadata }
          : { metadata: params.metadata },
        allow_promotion_codes: true,
      });
      return session.url;
    } catch (err) {
      this.logger.error("createCheckoutSession failed", err);
      return null;
    }
  }

  async createWalletTopUpSession(params: {
    customerId: string;
    amountCents: number;
    successUrl: string;
    cancelUrl: string;
    userId: string;
  }): Promise<string | null> {
    if (!this.stripe) return null;
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "Consilium Wallet Top-Up" },
              unit_amount: params.amountCents,
            },
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          userId: params.userId,
          type: "wallet_topup",
          amountCents: String(params.amountCents),
        },
      });
      return session.url;
    } catch (err) {
      this.logger.error("createWalletTopUpSession failed", err);
      return null;
    }
  }

  async createCustomerPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<string | null> {
    if (!this.stripe) return null;
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session.url;
    } catch (err) {
      this.logger.error("createCustomerPortalSession failed", err);
      return null;
    }
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<boolean> {
    if (!this.stripe) return false;
    try {
      await this.stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return true;
    } catch (err) {
      this.logger.error("cancelSubscription failed", err);
      return false;
    }
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event | null> {
    if (!this.stripe) return null;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return null;
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      this.logger.error("constructWebhookEvent failed", err);
      return null;
    }
  }

  async getSubscription(
    stripeSubscriptionId: string,
  ): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;
    try {
      return await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    } catch {
      return null;
    }
  }

  async listInvoices(
    customerId: string,
    limit = 10,
  ): Promise<Stripe.Invoice[]> {
    if (!this.stripe) return [];
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });
      return invoices.data;
    } catch {
      return [];
    }
  }
}
