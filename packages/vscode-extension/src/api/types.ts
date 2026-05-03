import type { DebateMode } from "@consilium/shared/debates";

export interface CreateDebateRequest {
  topic: string;
  models: string[];
  mode?: DebateMode;
  personaId?: string;
  debateSource?: "web" | "cli" | "vscode";
  projectContext?: Record<string, unknown>;
  conversationId?: string;
}

export interface CreateDebateResponse {
  id: string;
  status: string;
  mode: string;
  models: string[];
  topic: string;
  createdAt: string;
}

export interface DebateSummary {
  id: string;
  topic: string;
  mode: string;
  status: string;
  createdAt: string;
  totalCost?: number;
  modelsUsed?: string[];
  archived?: boolean;
  conversationId?: string | null;
}

export interface DebateDetail extends DebateSummary {
  rounds?: Array<Record<string, unknown>>;
  goldenPrompt?: string | null;
  totalTokens?: number;
}

export interface CreateDeliberationRequest {
  topic: string;
  models: string[];
  mode?: string;
  maxRounds?: number;
  apiKeys?: ProviderApiKeys;
  content?: string;
  categories?: string[];
  responses?: string[];
}

export interface ProviderApiKeys {
  openaiKey?: string;
  anthropicKey?: string;
  googleKey?: string;
  groqKey?: string;
  xaiKey?: string;
  moonshotKey?: string;
  openrouterKey?: string;
}

export interface CostEstimate {
  estimatedCost: number;
  rounds: number;
  mode: string;
  breakdown: Array<{ model: string; role: string; estimatedCost: number }>;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface SseEnvelope {
  event?: string;
  type?: string;
  message?: string;
  [key: string]: unknown;
}

export type StreamEventHandler = (event: SseEnvelope) => void | Promise<void>;
