import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildEditPreview, type EditPreview } from "./diff-preview";
import { parseEditActions, type EditAction } from "./patch-parser";
import {
  createRollbackSnapshot,
  restoreRollbackSnapshot,
  type RollbackSnapshot,
} from "./rollback";

const AUDIT_FILE = path.join(
  os.homedir(),
  ".consilium",
  "edit-history",
  "audit.jsonl",
);

export interface ParsedEditsResult {
  edits: EditAction[];
  preview: EditPreview[];
}

export interface ApplyEditsResult {
  applied: number;
  snapshot: RollbackSnapshot;
}

function assertInsideRoot(rootPath: string, relativePath: string): string {
  const fullPath = path.resolve(rootPath, relativePath);
  const normalizedRoot = path.resolve(rootPath);
  if (
    !(
      fullPath === normalizedRoot ||
      fullPath.startsWith(normalizedRoot + path.sep)
    )
  ) {
    throw new Error(`Unsafe edit path outside project root: ${relativePath}`);
  }
  return fullPath;
}

function writeAuditRecord(data: Record<string, unknown>): void {
  const auditDir = path.dirname(AUDIT_FILE);
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(data) + "\n", "utf-8");
}

export function parseEditsFromSynthesis(
  synthesis: string,
  rootPath: string,
): ParsedEditsResult {
  const edits = parseEditActions(synthesis);
  if (edits.length === 0) {
    return { edits: [], preview: [] };
  }
  for (const edit of edits) {
    assertInsideRoot(rootPath, edit.path);
  }
  const preview = buildEditPreview(rootPath, edits);
  return { edits, preview };
}

export function applyEdits(
  rootPath: string,
  edits: EditAction[],
): ApplyEditsResult {
  if (edits.length === 0) {
    throw new Error("No edits to apply.");
  }
  const snapshot = createRollbackSnapshot(rootPath, edits);

  try {
    for (const edit of edits) {
      const fullPath = assertInsideRoot(rootPath, edit.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, edit.content, "utf-8");
    }
  } catch (error) {
    restoreRollbackSnapshot(snapshot);
    throw error;
  }

  writeAuditRecord({
    ts: new Date().toISOString(),
    snapshotId: snapshot.id,
    rootPath,
    files: edits.map((e) => e.path),
    count: edits.length,
  });

  return {
    applied: edits.length,
    snapshot,
  };
}
