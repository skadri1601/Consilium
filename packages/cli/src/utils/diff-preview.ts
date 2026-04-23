import fs from "node:fs";
import path from "node:path";
import type { EditAction } from "./patch-parser";

export interface EditPreview {
  path: string;
  exists: boolean;
  oldLines: number;
  newLines: number;
  deltaLines: number;
}

function countLines(content: string): number {
  if (!content) return 0;
  return content.split("\n").length;
}

export function buildEditPreview(
  rootPath: string,
  edits: EditAction[],
): EditPreview[] {
  return edits.map((edit) => {
    const fullPath = path.resolve(rootPath, edit.path);
    const exists = fs.existsSync(fullPath);
    const oldContent = exists ? fs.readFileSync(fullPath, "utf-8") : "";
    const oldLines = countLines(oldContent);
    const newLines = countLines(edit.content);
    return {
      path: edit.path,
      exists,
      oldLines,
      newLines,
      deltaLines: newLines - oldLines,
    };
  });
}

export function formatEditPreview(preview: EditPreview[]): string {
  if (preview.length === 0) return "No edits detected.";
  const lines: string[] = [];
  for (const item of preview) {
    const state = item.exists ? "update" : "create";
    const delta =
      item.deltaLines >= 0 ? `+${item.deltaLines}` : `${item.deltaLines}`;
    lines.push(
      `${state.padEnd(7)} ${item.path} (${item.oldLines} -> ${item.newLines}, ${delta} lines)`,
    );
  }
  return lines.join("\n");
}
