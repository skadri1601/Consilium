import type { Provider } from "./provider";
import { MODELS } from "./models";

export const MODEL_PROVIDER_MAP: Record<string, Provider> = Object.fromEntries(
  MODELS.map((m) => [m.id, m.provider]),
);

export function getProviderForModel(modelId: string): Provider | undefined {
  return MODEL_PROVIDER_MAP[modelId];
}
