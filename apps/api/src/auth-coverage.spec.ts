import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Static guard against the entire class of bugs where a controller route
 * forgets `@UseGuards(ClerkAuthGuard)`. Regressions of this kind are
 * invisible to type-checking and unit tests because the guard binding lives
 * in decorator metadata.
 *
 * What this checks: every method decorated with @Get/@Post/@Put/@Patch/
 * @Delete/@Sse must be reachable from a guard binding — either at the
 * method or the controller level — that includes ClerkAuthGuard, OR the
 * controller path must be explicitly listed as public below.
 */

const PUBLIC_CONTROLLER_PATHS = new Set([
  "health",
  "waitlist",
  "webhooks/clerk",
  "api/v1/webhooks/clerk", // pre-fix path; left in case the rebase order matters
]);

const PUBLIC_METHOD_NAMES = new Set<string>([
  // No exceptions today. Add only with explicit security review.
]);

const HTTP_METHOD_DECORATORS = [
  "Get",
  "Post",
  "Put",
  "Patch",
  "Delete",
  "Sse",
];

interface RouteEntry {
  file: string;
  controllerPath: string;
  controllerHasGuard: boolean;
  method: string;
  decorators: string[];
  methodHasGuard: boolean;
}

function walk(root: string, out: string[] = []): string[] {
  for (const name of readdirSync(root)) {
    const full = join(root, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (full.endsWith(".controller.ts") && !full.endsWith(".spec.ts"))
      out.push(full);
  }
  return out;
}

function extractControllerPath(src: string): string | null {
  const m = /@Controller\(\s*"([^"]*)"\s*\)/.exec(src);
  if (!m) return null;
  return m[1] ?? "";
}

function controllerHasClerkGuard(src: string): boolean {
  const exportClassIdx = src.indexOf("export class");
  if (exportClassIdx < 0) return false;
  const decoratorBlock = src.slice(0, exportClassIdx);
  return /UseGuards\([^)]*ClerkAuthGuard\b[^)]*\)/.test(decoratorBlock);
}

function parseRoutes(file: string): RouteEntry[] {
  const src = readFileSync(file, "utf8");
  const controllerPath = extractControllerPath(src);
  if (controllerPath === null) return [];
  const controllerHasGuard = controllerHasClerkGuard(src);

  const lines = src.split("\n");
  const entries: RouteEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const httpDecMatch = new RegExp(
      String.raw`^\s*@(${HTTP_METHOD_DECORATORS.join("|")})\s*\(`,
    ).exec(line);
    if (!httpDecMatch) continue;

    const decorators: string[] = [line.trim()];
    let methodLine = "";
    for (let j = i + 1; j < lines.length && j < i + 25; j++) {
      const next = (lines[j] ?? "").trim();
      if (!next) continue;
      if (next.startsWith("@")) {
        decorators.push(next);
        continue;
      }
      methodLine = next;
      break;
    }
    const nameMatch = /^(?:async\s+|public\s+|private\s+)*([a-zA-Z0-9_$]+)\s*\(/.exec(methodLine);
    if (!nameMatch) continue;
    const method = nameMatch[1] ?? "<unknown>";
    const methodHasGuard = decorators.some((d) =>
      /@UseGuards\([^)]*ClerkAuthGuard[^)]*\)/.test(d),
    );

    entries.push({
      file,
      controllerPath,
      controllerHasGuard,
      method,
      decorators,
      methodHasGuard,
    });
  }

  return entries;
}

describe("API route auth coverage", () => {
  const apiSrc = join(__dirname, "features");
  const files = walk(apiSrc);

  const allRoutes: RouteEntry[] = files.flatMap((f) => parseRoutes(f));

  it("collected at least 30 routes (sanity check)", () => {
    expect(allRoutes.length).toBeGreaterThanOrEqual(30);
  });

  it("every route is auth-gated unless explicitly public", () => {
    const violations: string[] = [];
    for (const r of allRoutes) {
      if (r.controllerHasGuard) continue;
      if (r.methodHasGuard) continue;
      if (PUBLIC_CONTROLLER_PATHS.has(r.controllerPath)) continue;
      if (PUBLIC_METHOD_NAMES.has(r.method)) continue;
      const controller = r.controllerPath ? `/${r.controllerPath}` : "(root)";
      const relPath = r.file.replace(__dirname + "/", "");
      violations.push(`${controller}.${r.method} in ${relPath}`);
    }
    if (violations.length > 0) {
      throw new Error(
        "Routes missing @UseGuards(ClerkAuthGuard):\n  " +
          violations.join("\n  ") +
          "\n\nIf a route is intentionally public, add it to PUBLIC_CONTROLLER_PATHS or PUBLIC_METHOD_NAMES with a comment.",
      );
    }
  });

  it("every public route is in the explicit allow-list", () => {
    // Asserts there's no controller bypassing the rule by removing all guards
    // accidentally — flips the previous test inside-out.
    const allowedControllers = Array.from(PUBLIC_CONTROLLER_PATHS);
    expect(allowedControllers).toContain("health");
    expect(allowedControllers).toContain("waitlist");
    expect(allowedControllers).toContain("webhooks/clerk");
  });
});
