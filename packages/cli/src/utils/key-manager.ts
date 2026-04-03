import { loadConfig, saveConfig } from './config';

export type Provider = 'openai' | 'anthropic' | 'google' | 'xai';

export const PROVIDER_ENV_VARS: Record<Provider, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_API_KEY',
  xai: 'XAI_API_KEY',
};

export const PROVIDER_DISPLAY_NAMES: Record<Provider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google/Gemini',
  xai: 'xAI/Grok',
};

const MODEL_PROVIDER_MAP: Record<string, Provider> = {
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4': 'openai',
  'o1': 'openai',
  'o3': 'openai',
  'claude-opus': 'anthropic',
  'claude-sonnet': 'anthropic',
  'claude-haiku': 'anthropic',
  'gemini-pro': 'google',
  'gemini-flash': 'google',
  'gemini-2.5-pro': 'google',
  'grok-2': 'xai',
  'grok-3': 'xai',
};

const JUDGE_PRIORITY: Provider[] = ['anthropic', 'google', 'openai', 'xai'];

export class KeyManager {
  getKey(provider: Provider): string | undefined {
    const envVar = PROVIDER_ENV_VARS[provider];
    const envValue = process.env[envVar];
    if (envValue) return envValue;
    const keys = this.loadProviderKeys();
    return keys[provider];
  }

  setKey(provider: Provider, key: string): void {
    const keys = this.loadProviderKeys();
    keys[provider] = key;
    this.saveProviderKeys(keys);
  }

  removeKey(provider: Provider): void {
    const keys = this.loadProviderKeys();
    delete keys[provider];
    this.saveProviderKeys(keys);
  }

  listKeys(): Array<{ provider: Provider; source: 'env' | 'config'; masked: string }> {
    const result: Array<{ provider: Provider; source: 'env' | 'config'; masked: string }> = [];
    const providers: Provider[] = ['openai', 'anthropic', 'google', 'xai'];
    const configKeys = this.loadProviderKeys();

    for (const provider of providers) {
      const envVar = PROVIDER_ENV_VARS[provider];
      const envValue = process.env[envVar];
      if (envValue) {
        result.push({ provider, source: 'env', masked: this.maskKey(envValue) });
      } else if (configKeys[provider]) {
        result.push({ provider, source: 'config', masked: this.maskKey(configKeys[provider]) });
      }
    }

    return result;
  }

  hasKey(provider: Provider): boolean {
    return this.getKey(provider) !== undefined;
  }

  getAvailableProviders(): Provider[] {
    const providers: Provider[] = ['openai', 'anthropic', 'google', 'xai'];
    return providers.filter((p) => this.hasKey(p));
  }

  resolveKeysForModels(models: string[]): Map<string, string | undefined> {
    const result = new Map<string, string | undefined>();
    for (const model of models) {
      const provider = MODEL_PROVIDER_MAP[model];
      result.set(model, provider ? this.getKey(provider) : undefined);
    }
    return result;
  }

  getJudgeProvider(debateModels: string[]): Provider | undefined {
    const debateProviders = new Set(
      debateModels.map((m) => MODEL_PROVIDER_MAP[m]).filter(Boolean)
    );

    for (const candidate of JUDGE_PRIORITY) {
      if (!debateProviders.has(candidate) && this.hasKey(candidate)) {
        return candidate;
      }
    }

    for (const candidate of JUDGE_PRIORITY) {
      if (this.hasKey(candidate)) {
        return candidate;
      }
    }

    return undefined;
  }

  private loadProviderKeys(): Record<string, string> {
    const config = loadConfig() as any;
    return config.providerKeys || {};
  }

  private saveProviderKeys(keys: Record<string, string>): void {
    const config = loadConfig() as any;
    config.providerKeys = keys;
    saveConfig(config);
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '...' + key.slice(-4);
  }
}
