/**
 * EditAction format — backward compatible with the legacy { path, content }
 * shape, extended with surgical { kind: 'edit', oldString, newString } and
 * delete operations modeled after Claude Code's Edit tool semantics.
 */
export type EditAction =
  | { kind: "write"; path: string; content: string }
  | { kind: "edit"; path: string; oldString: string; newString: string; replaceAll?: boolean }
  | { kind: "delete"; path: string };

interface FencedBlock {
  language: string;
  body: string;
  rawLanguage: string;
}

function extractFencedBlocks(text: string): FencedBlock[] {
  const blocks: FencedBlock[] = [];
  const regex = /```([a-zA-Z0-9_:./\\-]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: (match[1] || "").trim().toLowerCase(),
      rawLanguage: match[1] || "",
      body: match[2] || "",
    });
  }
  return blocks;
}

function parseSearchReplaceBody(body: string, fallbackPath: string | null): EditAction[] {
  const actions: EditAction[] = [];
  const blockRe =
    /(?:^|\n)([^\n]+?)\n<{5,}\s*SEARCH\s*\n([\s\S]*?)\n={5,}\s*\n([\s\S]*?)\n>{5,}\s*REPLACE\s*(?=\n|$)/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(body)) !== null) {
    const filePath = (match[1] || "").trim();
    const oldString = match[2] ?? "";
    const newString = match[3] ?? "";
    if (filePath) {
      actions.push({ kind: "edit", path: filePath, oldString, newString });
    } else if (fallbackPath) {
      actions.push({ kind: "edit", path: fallbackPath, oldString, newString });
    }
  }
  if (actions.length > 0) return actions;

  const headlessRe =
    /<{5,}\s*SEARCH\s*\n([\s\S]*?)\n={5,}\s*\n([\s\S]*?)\n>{5,}\s*REPLACE/g;
  let headless: RegExpExecArray | null;
  while ((headless = headlessRe.exec(body)) !== null) {
    if (!fallbackPath) continue;
    actions.push({
      kind: "edit",
      path: fallbackPath,
      oldString: headless[1] ?? "",
      newString: headless[2] ?? "",
    });
  }
  return actions;
}

function coerceJsonEdit(item: unknown): EditAction | null {
  if (typeof item !== "object" || item === null) return null;
  const obj = item as Record<string, unknown>;
  const path = typeof obj.path === "string" ? obj.path : "";
  if (!path) return null;
  const kind = typeof obj.kind === "string" ? obj.kind : undefined;

  if (kind === "delete") {
    return { kind: "delete", path };
  }
  if (kind === "edit" || obj.old_string !== undefined || obj.oldString !== undefined) {
    const oldString =
      typeof obj.old_string === "string" ? obj.old_string :
      typeof obj.oldString === "string" ? obj.oldString : "";
    const newString =
      typeof obj.new_string === "string" ? obj.new_string :
      typeof obj.newString === "string" ? obj.newString : "";
    const replaceAll = Boolean(obj.replace_all ?? obj.replaceAll ?? false);
    return { kind: "edit", path, oldString, newString, replaceAll };
  }
  // Default: whole-file write (back-compat with { path, content })
  if (typeof obj.content === "string") {
    return { kind: "write", path, content: obj.content };
  }
  return null;
}

function parseJsonEdits(body: string): EditAction[] {
  try {
    const parsed: unknown = JSON.parse(body);
    if (Array.isArray(parsed)) {
      return parsed
        .map(coerceJsonEdit)
        .filter((a): a is EditAction => a !== null);
    }
    if (typeof parsed === "object" && parsed !== null) {
      const edits = (parsed as { edits?: unknown }).edits;
      if (Array.isArray(edits)) {
        return edits
          .map(coerceJsonEdit)
          .filter((a): a is EditAction => a !== null);
      }
    }
  } catch {
    return [];
  }
  return [];
}

function parseFileBlock(block: FencedBlock): EditAction | null {
  const m = /^file:(.+)$/i.exec(block.rawLanguage.trim());
  if (!m) return null;
  const path = (m[1] || "").trim();
  if (!path) return null;
  return { kind: "write", path, content: block.body };
}

export function parseEditActions(text: string): EditAction[] {
  const blocks = extractFencedBlocks(text);
  const actions: EditAction[] = [];

  for (const block of blocks) {
    if (block.language === "consilium-edits" || block.language === "json") {
      actions.push(...parseJsonEdits(block.body));
      continue;
    }
    const consiliumEditMatch = /^consilium-edit:(.+)$/i.exec(block.rawLanguage.trim());
    if (consiliumEditMatch) {
      const path = (consiliumEditMatch[1] || "").trim();
      actions.push(...parseSearchReplaceBody(block.body, path));
      continue;
    }
    if (block.language === "diff" || block.language === "search-replace") {
      actions.push(...parseSearchReplaceBody(block.body, null));
      continue;
    }
    const fileAction = parseFileBlock(block);
    if (fileAction) actions.push(fileAction);
  }

  return actions;
}
