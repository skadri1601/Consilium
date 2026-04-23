import { Injectable } from "@nestjs/common";

export type SubscriptionTier = "FREE" | "PRO" | "MAX";

export interface TierLimits {
  debatesPerDay: number;
  modelsPerDebate: number;
  councilProvidedModels: boolean;
  maxCostCentsPerMonth: number;
  monthlyPriceCents: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  FREE: {
    debatesPerDay: 5,
    modelsPerDebate: 2,
    councilProvidedModels: false,
    maxCostCentsPerMonth: 0,
    monthlyPriceCents: 0,
  },
  PRO: {
    debatesPerDay: 50,
    modelsPerDebate: 5,
    councilProvidedModels: true,
    maxCostCentsPerMonth: 5000,
    monthlyPriceCents: 2900,
  },
  MAX: {
    debatesPerDay: -1,
    modelsPerDebate: -1,
    councilProvidedModels: true,
    maxCostCentsPerMonth: 20000,
    monthlyPriceCents: 9900,
  },
};

export const MODEL_PRICING: Record<
  string,
  { inputPer1MTokensCents: number; outputPer1MTokensCents: number }
> = {
  "claude-opus-4-6": {
    inputPer1MTokensCents: 1500,
    outputPer1MTokensCents: 7500,
  },
  "claude-sonnet-4-6": {
    inputPer1MTokensCents: 300,
    outputPer1MTokensCents: 1500,
  },
  "claude-sonnet-4-20250514": {
    inputPer1MTokensCents: 300,
    outputPer1MTokensCents: 1500,
  },
  "claude-haiku-4-5-20251001": {
    inputPer1MTokensCents: 25,
    outputPer1MTokensCents: 125,
  },
  "gpt-4o": { inputPer1MTokensCents: 250, outputPer1MTokensCents: 1000 },
  "gpt-4o-mini": { inputPer1MTokensCents: 15, outputPer1MTokensCents: 60 },
  "gpt-4.1": { inputPer1MTokensCents: 200, outputPer1MTokensCents: 800 },
  "gemini-2.0-flash": { inputPer1MTokensCents: 10, outputPer1MTokensCents: 40 },
  "gemini-2.5-pro": {
    inputPer1MTokensCents: 125,
    outputPer1MTokensCents: 1000,
  },
  "llama-3.3-70b-versatile": {
    inputPer1MTokensCents: 0,
    outputPer1MTokensCents: 0,
  },
  "llama-3.1-8b-instant": {
    inputPer1MTokensCents: 0,
    outputPer1MTokensCents: 0,
  },
  "grok-2-1212": { inputPer1MTokensCents: 200, outputPer1MTokensCents: 1000 },
};

@Injectable()
export class PlansService {
  getLimits(tier: SubscriptionTier): TierLimits {
    return TIER_LIMITS[tier];
  }

  calculateModelCostCents(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    applyMarkup = false,
  ): number {
    const pricing = MODEL_PRICING[modelId];
    if (!pricing) return 0;
    const raw =
      (inputTokens / 1_000_000) * pricing.inputPer1MTokensCents +
      (outputTokens / 1_000_000) * pricing.outputPer1MTokensCents;
    return Math.ceil(applyMarkup ? raw * 1.2 : raw);
  }

  isFreeModel(modelId: string): boolean {
    const pricing = MODEL_PRICING[modelId];
    return (
      !pricing ||
      (pricing.inputPer1MTokensCents === 0 &&
        pricing.outputPer1MTokensCents === 0)
    );
  }

  getStripePriceId(tier: SubscriptionTier): string | null {
    if (tier === "PRO") return process.env.STRIPE_PRO_PRICE_ID || null;
    if (tier === "MAX") return process.env.STRIPE_MAX_PRICE_ID || null;
    return null;
  }

  getAllPlans() {
    return Object.entries(TIER_LIMITS).map(([tier, limits]) => ({
      tier,
      ...limits,
      stripePriceId: this.getStripePriceId(tier as SubscriptionTier),
    }));
  }
}
