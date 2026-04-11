import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';

export type PermissionLevel = 'deny' | 'session' | 'always';

interface PermissionEntry {
  level: PermissionLevel;
  grantedAt: string;
}

interface PermissionsData {
  permissions: Record<string, PermissionEntry>;
}

const PERMISSIONS_FILE = path.join(os.homedir(), '.consilium', 'permissions.json');

export class PermissionManager {
  private permissions: Record<string, PermissionEntry> = {};
  private readonly sessionPermissions: Set<string> = new Set();

  constructor() {
    this.load();
  }

  checkPermission(projectPath: string): PermissionLevel {
    const normalized = path.resolve(projectPath);

    if (this.sessionPermissions.has(normalized)) {
      return 'session';
    }

    const entry = this.permissions[normalized];
    if (entry?.level === 'always') {
      return 'always';
    }

    return 'deny';
  }

  async requestPermission(projectPath: string): Promise<PermissionLevel> {
    const normalized = path.resolve(projectPath);
    const existing = this.checkPermission(normalized);

    if (existing !== 'deny') {
      return existing;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        `\nConsilium wants to read your project files at ${normalized}.\n` +
          `Files are sent to LLM APIs for analysis but NOT stored in our database.\n` +
          `Only the synthesized summary is stored.\n` +
          `Allow? [y/n/always] `,
        resolve
      );
    });

    rl.close();

    const trimmed = answer.trim().toLowerCase();

    if (trimmed === 'always') {
      this.grantPermission(normalized, 'always');
      return 'always';
    } else if (trimmed === 'y' || trimmed === 'yes') {
      this.grantPermission(normalized, 'session');
      return 'session';
    }

    return 'deny';
  }

  grantPermission(projectPath: string, level: PermissionLevel): void {
    const normalized = path.resolve(projectPath);

    if (level === 'session') {
      this.sessionPermissions.add(normalized);
      return;
    }

    if (level === 'always') {
      this.permissions[normalized] = {
        level: 'always',
        grantedAt: new Date().toISOString(),
      };
      this.save();
      return;
    }

    this.revokePermission(normalized);
  }

  revokePermission(projectPath: string): void {
    const normalized = path.resolve(projectPath);
    this.sessionPermissions.delete(normalized);
    delete this.permissions[normalized];
    this.save();
  }

  listPermissions(): Record<string, PermissionLevel> {
    const result: Record<string, PermissionLevel> = {};

    for (const [p, entry] of Object.entries(this.permissions)) {
      result[p] = entry.level;
    }

    for (const p of this.sessionPermissions) {
      if (!result[p]) {
        result[p] = 'session';
      }
    }

    return result;
  }

  private save(): void {
    const dir = path.dirname(PERMISSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data: PermissionsData = { permissions: this.permissions };
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  private load(): void {
    if (!fs.existsSync(PERMISSIONS_FILE)) {
      this.permissions = {};
      return;
    }

    try {
      const raw = fs.readFileSync(PERMISSIONS_FILE, 'utf-8');
      const data: PermissionsData = JSON.parse(raw);
      this.permissions = data.permissions || {};
    } catch {
      this.permissions = {};
    }
  }
}
