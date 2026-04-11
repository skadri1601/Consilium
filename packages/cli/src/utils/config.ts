import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".consilium");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface Config {
  apiUrl?: string;
  apiKey?: string;
  webUrl?: string;
  debug?: boolean;
}

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      apiUrl: process.env.CONSILIUM_API_URL || "http://localhost:4000",
      webUrl: process.env.CONSILIUM_WEB_URL || "http://localhost:3000",
      debug:
        process.env.CONSILIUM_DEBUG === "1" ||
        process.env.CONSILIUM_DEBUG === "true",
    };
  }

  try {
    const config = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(config);
  } catch (error) {
    console.error("Failed to load config:", error);
    return {};
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
