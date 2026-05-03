import * as vscode from "vscode";

const TOKEN_KEY = "consilium.apiToken";
const PROVIDER_PREFIX = "consilium.providerKey.";

export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "groq"
  | "xai"
  | "moonshot"
  | "openrouter";

export const PROVIDER_IDS: ProviderId[] = [
  "openai",
  "anthropic",
  "google",
  "groq",
  "xai",
  "moonshot",
  "openrouter",
];

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  groq: "Groq",
  xai: "xAI",
  moonshot: "Moonshot",
  openrouter: "OpenRouter",
};

export class SecretsStore {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  async getApiToken(): Promise<string | undefined> {
    return this.secrets.get(TOKEN_KEY);
  }

  async setApiToken(token: string): Promise<void> {
    await this.secrets.store(TOKEN_KEY, token);
  }

  async clearApiToken(): Promise<void> {
    await this.secrets.delete(TOKEN_KEY);
  }

  async getProviderKey(provider: ProviderId): Promise<string | undefined> {
    return this.secrets.get(PROVIDER_PREFIX + provider);
  }

  async setProviderKey(provider: ProviderId, key: string): Promise<void> {
    await this.secrets.store(PROVIDER_PREFIX + provider, key);
  }

  async clearProviderKey(provider: ProviderId): Promise<void> {
    await this.secrets.delete(PROVIDER_PREFIX + provider);
  }

  async getAllProviderKeys(): Promise<Partial<Record<ProviderId, string>>> {
    const out: Partial<Record<ProviderId, string>> = {};
    for (const provider of PROVIDER_IDS) {
      const key = await this.getProviderKey(provider);
      if (key) out[provider] = key;
    }
    return out;
  }
}
