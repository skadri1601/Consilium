import * as vscode from "vscode";
import { isSensitiveFilename, looksLikeBinary, redactSecrets } from "./file-privacy";

export interface WorkspaceContext {
  files: Array<{ name: string; content: string }>;
  projectContext: Record<string, unknown>;
  rootPath: string;
  scanned: number;
  sent: number;
  skipped: { secret: number; binary: number; payloadLimit: number };
}

const HIGH_PRIORITY = new Set([
  "package.json",
  "tsconfig.json",
  "pyproject.toml",
  "Cargo.toml",
  "schema.prisma",
  ".env.example",
  "docker-compose.yml",
  "Dockerfile",
  "README.md",
]);

const EXCLUDE_GLOB =
  "{**/node_modules/**,**/dist/**,**/build/**,**/.next/**,**/.turbo/**,**/.venv/**,**/venv/**,**/__pycache__/**,**/.git/**,**/coverage/**,**/.vscode-test/**,**/target/**,**/.cache/**,**/.parcel-cache/**}";

const PER_FILE_LIMIT = 64 * 1024;

export async function collectWorkspaceContext(
  budgetBytes: number,
): Promise<WorkspaceContext | null> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return null;
  const root = folder.uri;
  const rootPath = root.fsPath;

  const uris = await vscode.workspace.findFiles("**/*", EXCLUDE_GLOB, 5000);

  const sorted = [...uris].sort((a, b) => priorityScore(a.fsPath) - priorityScore(b.fsPath));

  const skipped = { secret: 0, binary: 0, payloadLimit: 0 };
  const files: Array<{ name: string; content: string }> = [];
  let totalBytes = 0;
  let scanned = 0;

  for (const uri of sorted) {
    scanned++;
    const rel = vscode.workspace.asRelativePath(uri, false);
    if (isSensitiveFilename(rel)) {
      skipped.secret++;
      continue;
    }
    if (totalBytes >= budgetBytes) {
      skipped.payloadLimit++;
      continue;
    }

    let raw: Uint8Array;
    try {
      raw = await vscode.workspace.fs.readFile(uri);
    } catch {
      continue;
    }
    if (raw.byteLength > PER_FILE_LIMIT) {
      skipped.payloadLimit++;
      continue;
    }
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(raw);
    if (looksLikeBinary(decoded)) {
      skipped.binary++;
      continue;
    }
    const { content } = redactSecrets(decoded);
    const size = Buffer.byteLength(content, "utf-8");
    if (totalBytes + size > budgetBytes) {
      skipped.payloadLimit++;
      continue;
    }
    files.push({ name: rel, content });
    totalBytes += size;
  }

  const projectContext = await detectMetadata(root);

  return {
    files,
    projectContext,
    rootPath,
    scanned,
    sent: files.length,
    skipped,
  };
}

function priorityScore(absPath: string): number {
  const base = absPath.split(/[/\\]/).pop() ?? "";
  if (HIGH_PRIORITY.has(base)) return 0;
  if (base.endsWith(".prisma")) return 1;
  if (absPath.includes("/src/") || absPath.includes("\\src\\")) return 2;
  if (base.toLowerCase() === "readme.md") return 3;
  if (absPath.includes("/.github/") || absPath.includes("\\.github\\")) return 8;
  if (absPath.includes("/docs/") || absPath.includes("\\docs\\")) return 7;
  if (
    absPath.includes("/test") ||
    absPath.includes("\\test") ||
    absPath.includes(".test.") ||
    absPath.includes(".spec.")
  )
    return 6;
  return 4;
}

async function detectMetadata(root: vscode.Uri): Promise<Record<string, unknown>> {
  const ctx: Record<string, unknown> = {
    rootPath: root.fsPath,
    cwd: root.fsPath,
  };

  const has = async (rel: string): Promise<boolean> => {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, rel));
      return true;
    } catch {
      return false;
    }
  };

  const [hasPkg, hasPy, hasCargo, hasGo, hasDocker, hasCi, hasTests, hasGit] =
    await Promise.all([
      has("package.json"),
      has("pyproject.toml"),
      has("Cargo.toml"),
      has("go.mod"),
      has("Dockerfile"),
      has(".github/workflows"),
      has("tests").then((v) => v || has("__tests__").then((x) => x || has("test"))),
      has(".git"),
    ]);

  const language = hasPkg
    ? "typescript"
    : hasPy
      ? "python"
      : hasCargo
        ? "rust"
        : hasGo
          ? "go"
          : "unknown";

  ctx.language = language;
  ctx.hasDocker = hasDocker;
  ctx.hasCI = hasCi;
  ctx.hasTests = hasTests;
  ctx.isGitRepo = hasGit;

  if (hasPkg) {
    try {
      const buf = await vscode.workspace.fs.readFile(
        vscode.Uri.joinPath(root, "package.json"),
      );
      const json = JSON.parse(new TextDecoder().decode(buf)) as Record<string, unknown>;
      const deps = {
        ...(json.dependencies as Record<string, string> | undefined),
        ...(json.devDependencies as Record<string, string> | undefined),
      };
      ctx.framework = guessFramework(deps);
      ctx.packageManager = await detectPackageManager(root);
    } catch {
      // ignore parse errors
    }
  }

  return ctx;
}

function guessFramework(deps: Record<string, string>): string {
  if (deps["next"]) return "nextjs";
  if (deps["@nestjs/core"]) return "nestjs";
  if (deps["express"]) return "express";
  if (deps["fastify"]) return "fastify";
  if (deps["react"]) return "react";
  if (deps["vue"]) return "vue";
  if (deps["svelte"]) return "svelte";
  return "node";
}

async function detectPackageManager(root: vscode.Uri): Promise<string> {
  const checks: Array<[string, string]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ];
  for (const [file, name] of checks) {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, file));
      return name;
    } catch {
      continue;
    }
  }
  return "npm";
}
