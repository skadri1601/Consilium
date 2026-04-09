export type DeliberationMode =
  | 'quick'
  | 'council'
  | 'deep'
  | 'blind'
  | 'redteam'
  | 'jury'
  | 'market'
  | 'auto';

export interface DeliberateOptions {
  topic: string;
  mode: DeliberationMode;
  models?: string[];
  maxRounds?: number;
  apiKeys?: Record<string, string>;
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
  content: string;
  categories?: string[];
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
  responses: string[];
}

export interface EvaluationResult {
  rankings: number[];
  scores: Record<string, number>;
  method: string;
}

export interface DeliberationEvent {
  type: 'round_start' | 'argument' | 'rebuttal' | 'vote' | 'synthesis' | 'result' | 'error';
  round?: number;
  model?: string;
  content?: string;
  data?: DeliberationResult;
}

export interface CostEstimate {
  estimatedCost: number;
  breakdown: Record<string, number>;
  currency: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  uptime: number;
  services: Record<string, 'ok' | 'degraded' | 'down'>;
}

export interface ClientConfig {
  apiUrl?: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}
