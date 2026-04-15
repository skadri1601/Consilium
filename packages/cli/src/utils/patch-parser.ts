export interface EditAction {
  path: string;
  content: string;
}

function extractFencedBlocks(text: string): Array<{ language: string; body: string }> {
  const blocks: Array<{ language: string; body: string }> = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: (match[1] || '').trim().toLowerCase(),
      body: match[2] || '',
    });
  }
  return blocks;
}

function parseJsonEdits(body: string): EditAction[] {
  try {
    const parsed = JSON.parse(body) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is { path?: unknown; content?: unknown } => typeof item === 'object' && item !== null)
        .map((item) => ({
          path: String(item.path || ''),
          content: String(item.content || ''),
        }))
        .filter((item) => item.path.length > 0);
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const edits = (parsed as { edits?: unknown }).edits;
      if (Array.isArray(edits)) {
        return edits
          .filter((item): item is { path?: unknown; content?: unknown } => typeof item === 'object' && item !== null)
          .map((item) => ({
            path: String(item.path || ''),
            content: String(item.content || ''),
          }))
          .filter((item) => item.path.length > 0);
      }
    }
  } catch {
    return [];
  }
  return [];
}

function parseFileBlocks(text: string): EditAction[] {
  const results: EditAction[] = [];
  const regex = /```file:([^\n]+)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const filePath = (match[1] || '').trim();
    const content = match[2] || '';
    if (!filePath) continue;
    results.push({ path: filePath, content });
  }
  return results;
}

export function parseEditActions(text: string): EditAction[] {
  const blocks = extractFencedBlocks(text);
  for (const block of blocks) {
    if (block.language === 'consilium-edits' || block.language === 'json') {
      const parsed = parseJsonEdits(block.body);
      if (parsed.length > 0) return parsed;
    }
  }

  const fileBlocks = parseFileBlocks(text);
  if (fileBlocks.length > 0) return fileBlocks;
  return [];
}

