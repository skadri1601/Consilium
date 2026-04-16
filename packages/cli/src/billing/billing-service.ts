import { DEFAULT_API_ORIGIN, loadConfig } from '../utils/config.js';

export interface BillingSubscription {
  tier: 'FREE' | 'PRO' | 'MAX';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' | 'PAUSED';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingWallet {
  balanceCents: number;
  currency: string;
}

export interface BillingUsageLimits {
  debatesPerDay: number;
  modelsPerDebate: number;
  councilProvidedModels: boolean;
  maxCostCentsPerMonth: number;
}

export interface BillingUsage {
  tier: string;
  today: { debatesCount: number; limit: number };
  period: { debatesCount: number; tokensUsed: number; costCentsUsed: number };
  limits: BillingUsageLimits;
}

export interface BillingInfo {
  subscription: BillingSubscription;
  wallet: BillingWallet;
  usage: BillingUsage;
}

export interface LimitCheckResult {
  allowed: boolean;
  message?: string;
  remaining?: number;
}

let cachedBillingInfo: BillingInfo | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getBillingInfo(): Promise<BillingInfo | null> {
  const now = Date.now();
  if (cachedBillingInfo && now < cacheExpiresAt) {
    return cachedBillingInfo;
  }

  const config = loadConfig();
  const apiUrl = config.apiUrl || DEFAULT_API_ORIGIN;
  const apiKey = config.apiKey;

  if (!apiKey) return null;

  try {
    const response = await fetch(`${apiUrl}/api/v1/billing/subscription`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as BillingInfo;
    cachedBillingInfo = data;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return data;
  } catch {
    return null;
  }
}

export async function checkDebateLimit(): Promise<LimitCheckResult> {
  const info = await getBillingInfo();
  if (!info) return { allowed: true };

  const { today, limits } = info.usage;
  if (limits.debatesPerDay === -1) return { allowed: true };

  const remaining = limits.debatesPerDay - today.debatesCount;
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      message: `Daily debate limit reached (${today.debatesCount}/${limits.debatesPerDay} on ${info.subscription.tier} tier)\n  Upgrade to PRO for 50 debates/day: consilium upgrade\n  Or wait until tomorrow.`,
    };
  }

  return { allowed: true, remaining };
}

export async function checkModelLimit(requestedCount: number): Promise<LimitCheckResult> {
  const info = await getBillingInfo();
  if (!info) return { allowed: true };

  const { limits } = info.usage;
  if (limits.modelsPerDebate === -1) return { allowed: true };

  if (requestedCount > limits.modelsPerDebate) {
    const excess = requestedCount - limits.modelsPerDebate;
    return {
      allowed: false,
      message: `${info.subscription.tier} tier allows max ${limits.modelsPerDebate} models. Removing ${excess} model${excess === 1 ? '' : 's'} from selection.`,
    };
  }

  return { allowed: true };
}

export async function getTier(): Promise<string> {
  const info = await getBillingInfo();
  return info?.subscription.tier ?? 'FREE';
}

export async function getWalletBalance(): Promise<BillingWallet | null> {
  const info = await getBillingInfo();
  return info?.wallet ?? null;
}

export function invalidateCache(): void {
  cachedBillingInfo = null;
  cacheExpiresAt = 0;
}
