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

function defaultConfigFromEnv(): Config {
  return {
    apiUrl: process.env.CONSILIUM_API_URL || DEFAULT_API_ORIGIN,
    webUrl: process.env.CONSILIUM_WEB_URL || DEFAULT_WEB_ORIGIN,
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
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
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
