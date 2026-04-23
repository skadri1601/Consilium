import { describe, expect, it } from "vitest";
import { parseEditActions } from "./patch-parser";

describe("parseEditActions", () => {
  it("parses consilium-edits JSON blocks", () => {
    const input = [
      "Here are edits:",
      "```consilium-edits",
      "[",
      '  {"path":"src/a.ts","content":"export const a = 1;"}',
      "]",
      "```",
    ].join("\n");
    const edits = parseEditActions(input);
    expect(edits).toHaveLength(1);
    expect(edits[0]?.path).toBe("src/a.ts");
  });

  it("parses file:path blocks", () => {
    const input = ["```file:src/b.ts", "export const b = 2;", "```"].join("\n");
    const edits = parseEditActions(input);
    expect(edits).toHaveLength(1);
    expect(edits[0]?.content).toContain("b = 2");
  });
});
