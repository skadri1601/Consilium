import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".consilium");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export const DEFAULT_API_ORIGIN = "https://api.myconsilium.xyz";
export const DEFAULT_WEB_ORIGIN = "https://myconsilium.xyz";

export interface Config {
  apiUrl?: string;
  apiKey?: string;
  webUrl?: string;
  debug?: boolean;
  userName?: string;
  userEmail?: string;
}

function assertHttpsOrLocal(rawUrl: string, envVar: string): string {
  try {
    const parsed = new URL(rawUrl);
    const isLoopback =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";
    if (parsed.protocol !== "https:" && !isLoopback) {
      throw new Error(
        `${envVar} must be HTTPS (got ${parsed.protocol}). Set a secure URL or use localhost for local dev.`,
      );
    }
    return parsed.toString().replace(/\/$/, "");
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`${envVar} is not a valid URL: ${rawUrl}`);
    }
    throw err;
  }
}

function defaultConfigFromEnv(): Config {
  const apiUrl = process.env.CONSILIUM_API_URL
    ? assertHttpsOrLocal(process.env.CONSILIUM_API_URL, "CONSILIUM_API_URL")
    : DEFAULT_API_ORIGIN;
  const webUrl = process.env.CONSILIUM_WEB_URL
    ? assertHttpsOrLocal(process.env.CONSILIUM_WEB_URL, "CONSILIUM_WEB_URL")
    : DEFAULT_WEB_ORIGIN;
  return {
    apiUrl,
    webUrl,
    debug:
      process.env.CONSILIUM_DEBUG === "1" ||
      process.env.CONSILIUM_DEBUG === "true",
  };
}

export function loadConfig(): Config {
  const defaults = defaultConfigFromEnv();
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...defaults };
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Config>;
    return { ...defaults, ...parsed };
  } catch (error) {
    console.error("Failed to load config:", error);
    return { ...defaults };
  }
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  } else {
    try {
      fs.chmodSync(CONFIG_DIR, 0o700);
    } catch {
      // best-effort; ignore on platforms where chmod is unsupported
    }
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600,
  });
  try {
    fs.chmodSync(CONFIG_FILE, 0o600);
  } catch {
    // best-effort
  }
}

export function updateConfig(key: string, value: string): void {
  const config = loadConfig();
  (config as any)[key] = value;
  saveConfig(config);
}

export function getConfigValue(key: string): string | undefined {
  const config = loadConfig();
  return (config as any)[key];
}

export function listConfig(): Config {
  return loadConfig();
}

export function isLoggedIn(): boolean {
  const config = loadConfig();
  return !!config.apiKey && config.apiKey.startsWith("consilium_");
}

export function clearAuth(): void {
  const config = loadConfig();
  delete config.apiKey;
  delete config.userName;
  delete config.userEmail;
  saveConfig(config);
}
