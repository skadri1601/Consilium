export interface ModelPrice {
  inputPer1MTokensCents: number;
  outputPer1MTokensCents: number;
}

export const CONSILIUM_MARKUP_MULTIPLIER = 1.2;

export const MODEL_BILLING_RATES: Record<string, ModelPrice> = {
  'claude-opus-4-6': { inputPer1MTokensCents: 1500, outputPer1MTokensCents: 7500 },
  'claude-sonnet-4-6': { inputPer1MTokensCents: 300, outputPer1MTokensCents: 1500 },
  'claude-sonnet-4-20250514': { inputPer1MTokensCents: 300, outputPer1MTokensCents: 1500 },
  'claude-haiku-4-5-20251001': { inputPer1MTokensCents: 25, outputPer1MTokensCents: 125 },
  'gpt-4o': { inputPer1MTokensCents: 250, outputPer1MTokensCents: 1000 },
  'gpt-4o-mini': { inputPer1MTokensCents: 15, outputPer1MTokensCents: 60 },
  'gpt-4.1': { inputPer1MTokensCents: 200, outputPer1MTokensCents: 800 },
  'o3-mini': { inputPer1MTokensCents: 110, outputPer1MTokensCents: 440 },
  'gemini-2.0-flash': { inputPer1MTokensCents: 10, outputPer1MTokensCents: 40 },
  'gemini-2.5-flash': { inputPer1MTokensCents: 15, outputPer1MTokensCents: 60 },
  'gemini-2.5-pro': { inputPer1MTokensCents: 125, outputPer1MTokensCents: 1000 },
  'llama-3.3-70b-versatile': { inputPer1MTokensCents: 0, outputPer1MTokensCents: 0 },
  'llama-3.1-8b-instant': { inputPer1MTokensCents: 0, outputPer1MTokensCents: 0 },
  'llama-4-scout': { inputPer1MTokensCents: 0, outputPer1MTokensCents: 0 },
  'grok-2-1212': { inputPer1MTokensCents: 200, outputPer1MTokensCents: 1000 },
  'grok-2-mini': { inputPer1MTokensCents: 30, outputPer1MTokensCents: 100 },
};

export function calculateModelCostCents(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  applyMarkup = false,
): number {
  const pricing = MODEL_BILLING_RATES[modelId];
  if (!pricing) return 0;
  const rawCents =
    (inputTokens / 1_000_000) * pricing.inputPer1MTokensCents +
    (outputTokens / 1_000_000) * pricing.outputPer1MTokensCents;
  return Math.ceil(applyMarkup ? rawCents * CONSILIUM_MARKUP_MULTIPLIER : rawCents);
}

export function isFreeModel(modelId: string): boolean {
  const pricing = MODEL_BILLING_RATES[modelId];
  return !pricing || (pricing.inputPer1MTokensCents === 0 && pricing.outputPer1MTokensCents === 0);
}
