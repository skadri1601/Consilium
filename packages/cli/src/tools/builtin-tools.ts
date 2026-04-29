import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  hasCodebasePermission,
  getWritePermissionLevel,
  consumeWritePermission,
} from "../utils/codebase-permissions.js";
import { applyEdits } from "../utils/apply-edits.js";
import type { EditAction } from "../utils/patch-parser.js";

const execFileAsync = promisify(execFile);

export interface ToolSchemaJson {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface ToolContext {
  cwd: string;
  /** When true, write/exec tools error out instead of touching the filesystem. */
  readOnly?: boolean;
}

const MAX_FILE_BYTES = 256 * 1024;
const MAX_GREP_RESULTS = 200;
const MAX_GLOB_RESULTS = 500;
const BASH_TIMEOUT_MS = 30000;
const BASH_MAX_OUTPUT = 64 * 1024;

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".turbo", ".cache",
  "coverage", ".vercel", ".pnpm-store", "venv", ".venv", "__pycache__",
  ".pytest_cache", ".mypy_cache",
]);

function normalizeInsideRoot(cwd: string, relPath: string): string {
  const abs = path.resolve(cwd, relPath);
  const root = path.resolve(cwd);
  if (!(abs === root || abs.startsWith(root + path.sep))) {
    throw new Error(`Path escapes project root: ${relPath}`);
  }
  return abs;
}

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

function fail(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function ensureReadAllowed(cwd: string): void {
  if (hasCodebasePermission(cwd) === false) {
    throw new Error(`Codebase read denied for ${cwd}. Run /codebase allow.`);
  }
}

function ensureWriteAllowed(cwd: string): void {
  const level = getWritePermissionLevel(cwd);
  if (level === "deny" || level === "unset") {
    throw new Error(`Codebase write not allowed for ${cwd}. Use /apply to grant per-session write.`);
  }
  if (!consumeWritePermission(cwd)) {
    throw new Error(`Codebase write permission consumed; re-grant via /apply.`);
  }
}

// ───────── Read ─────────

export const READ_SCHEMA: ToolSchemaJson = {
  name: "consilium__read",
  description:
    "Read a file from the project. Returns text with line numbers (1-indexed). Truncates at 256 KB.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Project-relative file path" },
      offset: { type: "integer", description: "Starting line (1-indexed)", default: 1 },
      limit: { type: "integer", description: "Max lines to read (default: 2000)" },
    },
    required: ["path"],
  },
};

export async function handleRead(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  ensureReadAllowed(ctx.cwd);
  const relPath = String(args.path ?? "");
  if (!relPath) return fail("path is required");
  const abs = normalizeInsideRoot(ctx.cwd, relPath);
  if (!fs.existsSync(abs)) return fail(`File not found: ${relPath}`);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) return fail(`Path is a directory: ${relPath}`);
  if (stat.size > MAX_FILE_BYTES) {
    return fail(`File too large: ${relPath} (${stat.size} bytes; max ${MAX_FILE_BYTES})`);
  }
  const content = fs.readFileSync(abs, "utf-8");
  const lines = content.split("\n");
  const offset = Math.max(1, Number(args.offset ?? 1));
  const limit = Math.max(1, Number(args.limit ?? 2000));
  const slice = lines.slice(offset - 1, offset - 1 + limit);
  const numbered = slice.map((line, i) => `${String(offset + i).padStart(5)}\t${line}`).join("\n");
  const truncated = offset - 1 + limit < lines.length ? `\n[... ${lines.length - (offset - 1 + limit)} more lines]` : "";
  return ok(`${relPath}:\n${numbered}${truncated}`);
}

// ───────── Edit (surgical) ─────────

export const EDIT_SCHEMA: ToolSchemaJson = {
  name: "consilium__edit",
  description:
    "Edit a file by exact-string replacement (Claude Code semantics). old_string must appear exactly once unless replace_all=true. Pass empty old_string to create a new file.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Project-relative file path" },
      old_string: { type: "string", description: "Exact text to find. Empty to create new file." },
      new_string: { type: "string", description: "Replacement text" },
      replace_all: { type: "boolean", description: "Replace all occurrences", default: false },
    },
    required: ["path", "old_string", "new_string"],
  },
};

export async function handleEdit(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  if (ctx.readOnly) return fail("Edit refused: read-only context");
  ensureWriteAllowed(ctx.cwd);
  const relPath = String(args.path ?? "");
  const oldString = String(args.old_string ?? "");
  const newString = String(args.new_string ?? "");
  const replaceAll = Boolean(args.replace_all ?? false);
  if (!relPath) return fail("path is required");

  const action: EditAction =
    oldString === ""
      ? { kind: "write", path: relPath, content: newString }
      : { kind: "edit", path: relPath, oldString, newString, replaceAll };

  try {
    const result = applyEdits(ctx.cwd, [action]);
    return ok(
      `Edited ${relPath} (snapshot ${result.snapshot.id}). Run /rollback to restore.`,
    );
  } catch (err) {
    return fail(`Edit failed: ${(err as Error).message}`);
  }
}

// ───────── Write ─────────

export const WRITE_SCHEMA: ToolSchemaJson = {
  name: "consilium__write",
  description:
    "Write (or overwrite) the entire content of a file. Creates parent directories as needed.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Project-relative file path" },
      content: { type: "string", description: "Full file content" },
    },
    required: ["path", "content"],
  },
};

export async function handleWrite(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  if (ctx.readOnly) return fail("Write refused: read-only context");
  ensureWriteAllowed(ctx.cwd);
  const relPath = String(args.path ?? "");
  const content = String(args.content ?? "");
  if (!relPath) return fail("path is required");

  const action: EditAction = { kind: "write", path: relPath, content };
  try {
    const result = applyEdits(ctx.cwd, [action]);
    return ok(`Wrote ${relPath} (${content.length} bytes, snapshot ${result.snapshot.id}).`);
  } catch (err) {
    return fail(`Write failed: ${(err as Error).message}`);
  }
}

// ───────── Glob ─────────

export const GLOB_SCHEMA: ToolSchemaJson = {
  name: "consilium__glob",
  description:
    "Find files matching a glob pattern (e.g. **/*.ts, src/auth/*.{ts,tsx}). Returns up to 500 matches sorted by recency.",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Glob pattern, project-relative" },
      cwd: { type: "string", description: "Optional subdirectory to search from" },
    },
    required: ["pattern"],
  },
};

function compileGlob(pattern: string): RegExp {
  let re = "";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        re += ".*";
        i += 2;
        if (pattern[i] === "/") i++;
        continue;
      }
      re += "[^/]*";
    } else if (ch === "?") {
      re += "[^/]";
    } else if (ch === "{") {
      const end = pattern.indexOf("}", i);
      if (end === -1) re += "\\{";
      else {
        const opts = pattern.slice(i + 1, end).split(",").map((s) => s.trim());
        re += `(?:${opts.map((o) => o.replace(/[.+^$()|[\]\\]/g, "\\$&")).join("|")})`;
        i = end;
      }
    } else if (".+^$()|[]\\".includes(ch ?? "")) {
      re += "\\" + ch;
    } else {
      re += ch;
    }
    i++;
  }
  return new RegExp(`^${re}$`);
}

function walkFiles(root: string, base: string, out: string[]): void {
  if (out.length >= MAX_GLOB_RESULTS * 4) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(base, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (out.length >= MAX_GLOB_RESULTS * 4) return;
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(base, e.name);
    const rel = path.relative(root, abs);
    if (e.isDirectory()) {
      walkFiles(root, abs, out);
    } else if (e.isFile()) {
      out.push(rel.split(path.sep).join("/"));
    }
  }
}

export async function handleGlob(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  ensureReadAllowed(ctx.cwd);
  const pattern = String(args.pattern ?? "");
  if (!pattern) return fail("pattern is required");
  const subdir = args.cwd ? normalizeInsideRoot(ctx.cwd, String(args.cwd)) : ctx.cwd;
  const re = compileGlob(pattern);
  const all: string[] = [];
  walkFiles(ctx.cwd, subdir, all);
  const matches = all.filter((p) => re.test(p));
  const withMtime = matches
    .map((p) => {
      try {
        const m = fs.statSync(path.join(ctx.cwd, p)).mtimeMs;
        return { p, m };
      } catch {
        return { p, m: 0 };
      }
    })
    .sort((a, b) => b.m - a.m)
    .slice(0, MAX_GLOB_RESULTS)
    .map((x) => x.p);
  if (withMtime.length === 0) return ok(`No matches for ${pattern}`);
  const truncated = matches.length > withMtime.length ? `\n[... ${matches.length - withMtime.length} more]` : "";
  return ok(`${withMtime.length} match${withMtime.length === 1 ? "" : "es"}:\n${withMtime.join("\n")}${truncated}`);
}

// ───────── Grep ─────────

export const GREP_SCHEMA: ToolSchemaJson = {
  name: "consilium__grep",
  description:
    "Search file contents with a regex. Returns up to 200 matches with file:line prefix.",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regex pattern" },
      glob: { type: "string", description: "Optional file glob to restrict search (e.g. **/*.ts)" },
      ignore_case: { type: "boolean", description: "Case-insensitive match", default: false },
    },
    required: ["pattern"],
  },
};

export async function handleGrep(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  ensureReadAllowed(ctx.cwd);
  const pattern = String(args.pattern ?? "");
  if (!pattern) return fail("pattern is required");
  const ignoreCase = Boolean(args.ignore_case ?? false);
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, ignoreCase ? "gi" : "g");
  } catch (err) {
    return fail(`Invalid regex: ${(err as Error).message}`);
  }

  const fileGlob = args.glob ? compileGlob(String(args.glob)) : null;
  const all: string[] = [];
  walkFiles(ctx.cwd, ctx.cwd, all);
  const candidates = fileGlob ? all.filter((p) => fileGlob.test(p)) : all;

  const matches: string[] = [];
  for (const rel of candidates) {
    if (matches.length >= MAX_GREP_RESULTS) break;
    const abs = path.join(ctx.cwd, rel);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(abs);
    } catch {
      continue;
    }
    if (stat.size > MAX_FILE_BYTES) continue;
    let content: string;
    try {
      content = fs.readFileSync(abs, "utf-8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (matches.length >= MAX_GREP_RESULTS) break;
      regex.lastIndex = 0;
      if (regex.test(lines[i] ?? "")) {
        matches.push(`${rel}:${i + 1}: ${(lines[i] ?? "").slice(0, 200)}`);
      }
    }
  }
  if (matches.length === 0) return ok(`No matches for /${pattern}/`);
  return ok(matches.join("\n"));
}

// ───────── GitDiff ─────────

export const GIT_DIFF_SCHEMA: ToolSchemaJson = {
  name: "consilium__git_diff",
  description:
    "Show uncommitted git diff for the project. Useful to give the council the WIP context.",
  inputSchema: {
    type: "object",
    properties: {
      staged: { type: "boolean", description: "Show staged changes only", default: false },
      path: { type: "string", description: "Optional path to limit diff scope" },
    },
  },
};

export async function handleGitDiff(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  ensureReadAllowed(ctx.cwd);
  const staged = Boolean(args.staged ?? false);
  const subPath = args.path ? String(args.path) : undefined;
  const argv = ["diff", ...(staged ? ["--staged"] : []), ...(subPath ? ["--", subPath] : [])];
  try {
    const { stdout } = await execFileAsync("git", argv, {
      cwd: ctx.cwd,
      maxBuffer: BASH_MAX_OUTPUT,
      timeout: BASH_TIMEOUT_MS,
    });
    if (!stdout.trim()) return ok("(no changes)");
    return ok(stdout.length > BASH_MAX_OUTPUT ? stdout.slice(0, BASH_MAX_OUTPUT) + "\n[... truncated]" : stdout);
  } catch (err) {
    return fail(`git diff failed: ${(err as Error).message}`);
  }
}

// ───────── Bash (gated) ─────────

const BASH_DENY_PATTERNS = [
  /\brm\s+-rf?\s+\//,
  /\bsudo\b/,
  /\bcurl\b.*\|.*\bsh\b/,
  /\bwget\b.*\|.*\bsh\b/,
  /\b:\s*\(\s*\)\s*\{/,  // fork bomb
  /\bdd\s+if=\/dev\/(zero|random)/,
  /\bmkfs\b/,
  /\bshutdown\b/,
  /\breboot\b/,
];

export const BASH_SCHEMA: ToolSchemaJson = {
  name: "consilium__bash",
  description:
    "Run a shell command (read-only by default; write commands require explicit approval). Output truncated at 64 KB. Common destructive patterns are blocked.",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to execute" },
      timeout_ms: { type: "integer", description: "Max execution time in ms (default 30000)", default: 30000 },
    },
    required: ["command"],
  },
};

export async function handleBash(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  if (ctx.readOnly) return fail("Bash refused: read-only context");
  ensureWriteAllowed(ctx.cwd);
  const command = String(args.command ?? "").trim();
  if (!command) return fail("command is required");

  for (const deny of BASH_DENY_PATTERNS) {
    if (deny.test(command)) {
      return fail(`Blocked dangerous command pattern: ${deny.source}`);
    }
  }

  const timeoutMs = Math.min(BASH_TIMEOUT_MS, Math.max(1000, Number(args.timeout_ms ?? BASH_TIMEOUT_MS)));
  try {
    const { stdout, stderr } = await execFileAsync("/bin/sh", ["-c", command], {
      cwd: ctx.cwd,
      timeout: timeoutMs,
      maxBuffer: BASH_MAX_OUTPUT * 2,
    });
    const out = (stdout || "") + (stderr ? `\n[stderr]\n${stderr}` : "");
    if (out.length > BASH_MAX_OUTPUT) {
      return ok(out.slice(0, BASH_MAX_OUTPUT) + "\n[... truncated]");
    }
    return ok(out || "(no output)");
  } catch (err) {
    const e = err as { message?: string; stdout?: string; stderr?: string; code?: number };
    const summary = `exit ${e.code ?? "?"}: ${e.message ?? "unknown"}`;
    const tail = (e.stderr || e.stdout || "").slice(-2000);
    return fail(`${summary}${tail ? `\n${tail}` : ""}`);
  }
}

// ───────── Registry ─────────

export const BUILTIN_TOOLS: ToolSchemaJson[] = [
  READ_SCHEMA,
  EDIT_SCHEMA,
  WRITE_SCHEMA,
  GLOB_SCHEMA,
  GREP_SCHEMA,
  GIT_DIFF_SCHEMA,
  BASH_SCHEMA,
];

const HANDLERS: Record<string, (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>> = {
  [READ_SCHEMA.name]: handleRead,
  [EDIT_SCHEMA.name]: handleEdit,
  [WRITE_SCHEMA.name]: handleWrite,
  [GLOB_SCHEMA.name]: handleGlob,
  [GREP_SCHEMA.name]: handleGrep,
  [GIT_DIFF_SCHEMA.name]: handleGitDiff,
  [BASH_SCHEMA.name]: handleBash,
};

export function isBuiltinTool(name: string): boolean {
  return name in HANDLERS;
}

export async function callBuiltinTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  const handler = HANDLERS[name];
  if (!handler) return fail(`Unknown built-in tool: ${name}`);
  try {
    return await handler(args, ctx);
  } catch (err) {
    return fail(`${name} failed: ${(err as Error).message}`);
  }
}
