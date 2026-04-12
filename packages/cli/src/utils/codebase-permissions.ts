import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";

const PERMISSIONS_FILE = path.join(os.homedir(), ".consilium", "permissions.json");

interface PermissionsStore {
  [directory: string]: {
    granted: boolean;
    grantedAt: string;
  };
}

function loadPermissions(): PermissionsStore {
  try {
    if (fs.existsSync(PERMISSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function savePermissions(store: PermissionsStore): void {
  const dir = path.dirname(PERMISSIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(store, null, 2));
}

export function hasCodebasePermission(directory: string): boolean | null {
  const store = loadPermissions();
  const normalized = path.resolve(directory);
  const entry = store[normalized];
  if (!entry) return null;
  return entry.granted;
}

export function grantCodebasePermission(directory: string): void {
  const store = loadPermissions();
  const normalized = path.resolve(directory);
  store[normalized] = { granted: true, grantedAt: new Date().toISOString() };
  savePermissions(store);
}

export function revokeCodebasePermission(directory?: string): void {
  if (!directory) {
    savePermissions({});
    return;
  }
  const store = loadPermissions();
  const normalized = path.resolve(directory);
  delete store[normalized];
  savePermissions(store);
}

export async function requestCodebasePermission(directory: string): Promise<boolean> {
  const existing = hasCodebasePermission(directory);
  if (existing === true) return true;
  if (existing === false) return false;

  if (!process.stdin.isTTY) {
    return false;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question(
      `Consilium wants to read project files in ${directory} for codebase-aware deliberation. Allow? [y/N] `,
      resolve,
    );
  });
  rl.close();

  const granted = answer.trim().toLowerCase() === "y";
  if (granted) {
    grantCodebasePermission(directory);
  }
  return granted;
}
