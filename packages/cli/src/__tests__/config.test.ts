import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TMP_HOME = vi.hoisted(() => {
  const base =
    process.env.TEMP || process.env.TMPDIR || process.env.TMP || "/tmp";
  return base.replace(/\\/g, "/") + `/consilium-test-${process.pid}`;
});

vi.mock("node:os", () => ({
  default: {
    homedir: () => TMP_HOME,
    tmpdir: () =>
      process.env.TEMP || process.env.TMPDIR || process.env.TMP || "/tmp",
  },
  homedir: () => TMP_HOME,
  tmpdir: () =>
    process.env.TEMP || process.env.TMPDIR || process.env.TMP || "/tmp",
}));

const CONFIG_DIR = TMP_HOME + "/.consilium";
const CONFIG_FILE = CONFIG_DIR + "/config.json";

function writeConfig(data: object) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data), "utf-8");
}

function clearConfigFile() {
  if (fs.existsSync(CONFIG_DIR)) {
    fs.rmSync(CONFIG_DIR, { recursive: true, force: true });
  }
}

import {
  loadConfig,
  saveConfig,
  updateConfig,
  getConfigValue,
  listConfig,
  isLoggedIn,
  clearAuth,
  DEFAULT_API_ORIGIN,
  DEFAULT_WEB_ORIGIN,
} from "../utils/config";

beforeEach(() => {
  clearConfigFile();
  vi.unstubAllEnvs();
});

afterEach(() => {
  clearConfigFile();
  vi.unstubAllEnvs();
});

describe("loadConfig", () => {
  it("returns defaults when no config file exists", () => {
    const cfg = loadConfig();
    expect(cfg.apiUrl).toBe(DEFAULT_API_ORIGIN);
    expect(cfg.webUrl).toBe(DEFAULT_WEB_ORIGIN);
    expect(cfg.debug).toBe(false);
  });

  it("merges file config over defaults", () => {
    writeConfig({ apiKey: "consilium_testkey12345678", userName: "Test User" });
    const cfg = loadConfig();
    expect(cfg.apiKey).toBe("consilium_testkey12345678");
    expect(cfg.userName).toBe("Test User");
    expect(cfg.apiUrl).toBe(DEFAULT_API_ORIGIN);
  });

  it("respects CONSILIUM_API_URL env var", () => {
    vi.stubEnv("CONSILIUM_API_URL", "http://localhost:3000");
    const cfg = loadConfig();
    expect(cfg.apiUrl).toBe("http://localhost:3000");
  });

  it("sets debug=true when CONSILIUM_DEBUG=1", () => {
    vi.stubEnv("CONSILIUM_DEBUG", "1");
    const cfg = loadConfig();
    expect(cfg.debug).toBe(true);
  });

  it("returns defaults when config file is malformed JSON", () => {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, "not json", "utf-8");
    const cfg = loadConfig();
    expect(cfg.apiUrl).toBe(DEFAULT_API_ORIGIN);
  });
});

describe("saveConfig / updateConfig / getConfigValue", () => {
  it("persists and retrieves a value", () => {
    saveConfig({
      apiKey: "consilium_abc123456789",
      apiUrl: DEFAULT_API_ORIGIN,
    });
    const val = getConfigValue("apiKey");
    expect(val).toBe("consilium_abc123456789");
  });

  it("updateConfig merges with existing config", () => {
    writeConfig({ apiKey: "consilium_old1234567" });
    updateConfig("userName", "Alice");
    const cfg = loadConfig();
    expect(cfg.apiKey).toBe("consilium_old1234567");
    expect(cfg.userName).toBe("Alice");
  });
});

describe("listConfig", () => {
  it("returns current config", () => {
    writeConfig({ apiKey: "consilium_list1234567" });
    const cfg = listConfig();
    expect(cfg.apiKey).toBe("consilium_list1234567");
  });
});

describe("isLoggedIn", () => {
  it("returns false when no apiKey", () => {
    expect(isLoggedIn()).toBe(false);
  });

  it("returns false for malformed token", () => {
    writeConfig({ apiKey: "badtoken" });
    expect(isLoggedIn()).toBe(false);
  });

  it("returns true for valid consilium_ token", () => {
    writeConfig({ apiKey: "consilium_validtoken12345" });
    expect(isLoggedIn()).toBe(true);
  });
});

describe("clearAuth", () => {
  it("removes apiKey, userName, userEmail but preserves apiUrl", () => {
    writeConfig({
      apiKey: "consilium_clearme12345",
      userName: "Alice",
      userEmail: "alice@example.com",
      apiUrl: DEFAULT_API_ORIGIN,
    });
    clearAuth();
    const cfg = loadConfig();
    expect(cfg.apiKey).toBeUndefined();
    expect(cfg.userName).toBeUndefined();
    expect(cfg.userEmail).toBeUndefined();
    expect(cfg.apiUrl).toBe(DEFAULT_API_ORIGIN);
  });
});
