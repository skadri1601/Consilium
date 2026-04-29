import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BUILTIN_TOOLS,
  callBuiltinTool,
  isBuiltinTool,
} from "./builtin-tools";
import { grantCodebasePermission, revokeCodebasePermission } from "../utils/codebase-permissions";

function makeTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "consilium-tools-test-"));
  return dir;
}

describe("builtin-tools", () => {
  const created: string[] = [];

  beforeEach(() => {
    created.length = 0;
  });

  afterEach(() => {
    for (const dir of created) {
      revokeCodebasePermission(dir);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("advertises 7 tools with valid schemas", () => {
    expect(BUILTIN_TOOLS.length).toBe(7);
    for (const t of BUILTIN_TOOLS) {
      expect(t.name).toMatch(/^consilium__/);
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.inputSchema.type).toBe("object");
    }
  });

  it("isBuiltinTool recognizes own names and rejects others", () => {
    expect(isBuiltinTool("consilium__read")).toBe(true);
    expect(isBuiltinTool("consilium__edit")).toBe(true);
    expect(isBuiltinTool("filesystem.read_file")).toBe(false);
    expect(isBuiltinTool("nope")).toBe(false);
  });

  it("read returns file contents with line numbers", async () => {
    const root = makeTempProject();
    created.push(root);
    grantCodebasePermission(root, "always");
    fs.writeFileSync(path.join(root, "hello.txt"), "alpha\nbeta\ngamma\n");

    const result = await callBuiltinTool("consilium__read", { path: "hello.txt" }, { cwd: root });
    expect(result.isError).toBeUndefined();
    expect(result.content[0]!.text).toContain("alpha");
    expect(result.content[0]!.text).toContain("    1\talpha");
    expect(result.content[0]!.text).toContain("    2\tbeta");
  });

  it("read refuses paths outside project root", async () => {
    const root = makeTempProject();
    created.push(root);
    grantCodebasePermission(root, "always");

    const result = await callBuiltinTool("consilium__read", { path: "../escape.txt" }, { cwd: root });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/escapes project root|failed/i);
  });

  it("read fails when codebase permission is denied", async () => {
    const root = makeTempProject();
    created.push(root);
    fs.writeFileSync(path.join(root, "secret.txt"), "sensitive");

    const result = await callBuiltinTool("consilium__read", { path: "secret.txt" }, { cwd: root });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/permission|allow/i);
  });

  it("grep finds matches across files", async () => {
    const root = makeTempProject();
    created.push(root);
    grantCodebasePermission(root, "always");
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(path.join(root, "src", "a.ts"), "export const NEEDLE = 1;\n");
    fs.writeFileSync(path.join(root, "src", "b.ts"), "// no match here\n");
    fs.writeFileSync(path.join(root, "src", "c.ts"), "function NEEDLE() {}\n");

    const result = await callBuiltinTool(
      "consilium__grep",
      { pattern: "NEEDLE" },
      { cwd: root },
    );
    expect(result.isError).toBeUndefined();
    expect(result.content[0]!.text).toContain("a.ts:1");
    expect(result.content[0]!.text).toContain("c.ts:1");
    expect(result.content[0]!.text).not.toContain("b.ts");
  });

  it("glob matches files by pattern", async () => {
    const root = makeTempProject();
    created.push(root);
    grantCodebasePermission(root, "always");
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(path.join(root, "src", "auth.ts"), "");
    fs.writeFileSync(path.join(root, "src", "auth.test.ts"), "");
    fs.writeFileSync(path.join(root, "src", "db.py"), "");

    const result = await callBuiltinTool(
      "consilium__glob",
      { pattern: "**/*.ts" },
      { cwd: root },
    );
    expect(result.isError).toBeUndefined();
    expect(result.content[0]!.text).toContain("src/auth.ts");
    expect(result.content[0]!.text).toContain("src/auth.test.ts");
    expect(result.content[0]!.text).not.toContain("db.py");
  });

  it("edit refuses without write permission", async () => {
    const root = makeTempProject();
    created.push(root);
    grantCodebasePermission(root, "always"); // read OK
    fs.writeFileSync(path.join(root, "f.ts"), "old");

    const result = await callBuiltinTool(
      "consilium__edit",
      { path: "f.ts", old_string: "old", new_string: "new" },
      { cwd: root },
    );
    // Without write permission grant, ensureWriteAllowed throws.
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/write/i);
  });

  it("bash blocks dangerous patterns", async () => {
    const root = makeTempProject();
    created.push(root);

    const result = await callBuiltinTool(
      "consilium__bash",
      { command: "rm -rf /" },
      { cwd: root },
    );
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/blocked|dangerous/i);
  });

  it("read-only context refuses Edit/Write/Bash", async () => {
    const root = makeTempProject();
    created.push(root);
    grantCodebasePermission(root, "always");

    const editRes = await callBuiltinTool(
      "consilium__edit",
      { path: "x", old_string: "a", new_string: "b" },
      { cwd: root, readOnly: true },
    );
    expect(editRes.isError).toBe(true);

    const writeRes = await callBuiltinTool(
      "consilium__write",
      { path: "x", content: "y" },
      { cwd: root, readOnly: true },
    );
    expect(writeRes.isError).toBe(true);

    const bashRes = await callBuiltinTool(
      "consilium__bash",
      { command: "echo hi" },
      { cwd: root, readOnly: true },
    );
    expect(bashRes.isError).toBe(true);
  });
});
