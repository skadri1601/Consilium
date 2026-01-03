export interface AnalyticsStats {
  totalQueries: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  queriesThisMonth: number;
  tokensThisMonth: number;
  costThisMonth: number;
}

export interface UsageRecord {
  date: string;
  queries: number;
  tokens: number;
  cost: number;
}

export interface ModelCost {
  modelId: string;
  modelName: string;
  tokens: number;
  cost: number;
  percentage: number;
}
