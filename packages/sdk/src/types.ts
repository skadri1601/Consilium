export type DeliberationMode =
  | 'council'
  | 'red-team'
  | 'blind-eval'
  | 'prediction-market'
  | 'adversarial'
  | 'delphi';

export interface DeliberateOptions {
  topic: string;
  mode?: DeliberationMode;
  models: string[];
  maxRounds?: number;
  apiKeys?: {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
    xaiKey?: string;
  };
}

export interface DeliberationResult {
  goldenPrompt: string;
  dissentReport: string;
  cost: number;
  auditTrail: string[];
  votes: Record<string, string>;
  confidenceScores: Record<string, number>;
}

export interface RedTeamOptions {
  topic: string;
  models: string[];
  categories?: string[];
  maxRounds?: number;
  apiKeys?: {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
    xaiKey?: string;
  };
}

export interface RedTeamReport {
  attacks: string[];
  defenses: string[];
  judgments: string[];
  overallScore: number;
  vulnerabilityCount: number;
}

export interface BlindEvalOptions {
  topic: string;
  models: string[];
  responses?: string[];
  maxRounds?: number;
  apiKeys?: {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
    xaiKey?: string;
  };
}

export interface EvaluationResult {
  rankings: number[];
  scores: Record<string, number>;
  method: string;
}

export interface DeliberationEvent {
  event: string;
  agentId?: string;
  chunk?: string;
  round?: number;
  model?: string;
  content?: string;
  message?: string;
  data?: DeliberationResult;
}

export interface CostEstimateBreakdown {
  model: string;
  role: string;
  estimatedCost: number;
}

export interface CostEstimate {
  estimatedCost: number;
  breakdown: CostEstimateBreakdown[];
  rounds: number;
  mode: string;
}

export interface HealthStatus {
  status: string;
  info?: Record<string, { status: string }>;
}

export interface ClientConfig {
  apiUrl?: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}
