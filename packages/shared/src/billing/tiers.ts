export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  MAX = 'MAX',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
  INCOMPLETE = 'INCOMPLETE',
  PAUSED = 'PAUSED',
}

export interface TierLimits {
  debatesPerDay: number;
  modelsPerDebate: number;
  councilProvidedModels: boolean;
  maxCostCentsPerMonth: number;
  features: string[];
  monthlyPriceCents: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  [SubscriptionTier.FREE]: {
    debatesPerDay: 5,
    modelsPerDebate: 2,
    councilProvidedModels: false,
    maxCostCentsPerMonth: 0,
    monthlyPriceCents: 0,
    features: [
      'byok',
      'basic_debate',
      '2_models_per_debate',
      'groq_free_models',
      'basic_analytics',
      'debate_history',
    ],
  },
  [SubscriptionTier.PRO]: {
    debatesPerDay: 50,
    modelsPerDebate: 5,
    councilProvidedModels: true,
    maxCostCentsPerMonth: 5000,
    monthlyPriceCents: 2900,
    features: [
      'byok',
      'all_models',
      'priority_queue',
      'codebase_debate',
      'workspace_context',
      '5_models_per_debate',
      'advanced_analytics',
      'cli_access',
      'api_access',
      'custom_personas',
      'export_formats',
    ],
  },
  [SubscriptionTier.MAX]: {
    debatesPerDay: -1,
    modelsPerDebate: -1,
    councilProvidedModels: true,
    maxCostCentsPerMonth: 20000,
    monthlyPriceCents: 9900,
    features: [
      'byok',
      'all_models',
      'priority_queue',
      'codebase_debate',
      'workspace_context',
      'unlimited_debates',
      'all_models_per_debate',
      'advanced_analytics',
      'cli_access',
      'api_access',
      'custom_personas',
      'export_formats',
      'fastest_responses',
      'dedicated_support',
    ],
  },
};

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function hasFeature(tier: SubscriptionTier, feature: string): boolean {
  return TIER_LIMITS[tier].features.includes(feature);
}

export function canUseCouncilModels(tier: SubscriptionTier): boolean {
  return TIER_LIMITS[tier].councilProvidedModels;
}
