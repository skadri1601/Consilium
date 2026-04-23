import { ConsiliumClient, DebateSummary } from "../api/client.js";
import { style } from "../utils/visual-system.js";
import { requireAuth } from "../utils/require-auth.js";

const st = style();

export interface ListDebatesOptions {
  limit?: string;
  offset?: string;
  search?: string;
  json?: boolean;
}

function formatRelative(iso?: string): string {
  if (!iso) return "";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  const diffMs = Date.now() - ts;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export async function listDebatesCommand(options: ListDebatesOptions): Promise<void> {
  await requireAuth();

  const parsedLimit = options.limit ? Number.parseInt(options.limit, 10) : 20;
  const parsedOffset = options.offset ? Number.parseInt(options.offset, 10) : 0;
  const limit =
    Number.isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 100);
  const offset = Number.isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;

  const client = new ConsiliumClient();
  let debates: DebateSummary[];
  try {
    debates = await client.listDebates({ limit, offset, search: options.search });
  } catch (err) {
    console.error(st.error(`Failed to list debates: ${(err as Error).message}`));
    process.exitCode = 1;
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(debates, null, 2));
    return;
  }

  if (debates.length === 0) {
    console.log(st.dim("No debates found."));
    return;
  }

  console.log(st.bold(`\n${debates.length} debate${debates.length === 1 ? "" : "s"}\n`));
  for (const d of debates) {
    const topic = truncate(d.topic ?? "(no topic)", 60);
    const mode = d.mode ?? "?";
    const status = d.status ?? "?";
    const when = formatRelative(d.updatedAt ?? d.createdAt);
    console.log(st.brand(`  ${d.id}`));
    console.log(`    ${topic}`);
    console.log(st.dim(`    mode=${mode}  status=${status}  ${when}`));
  }
  console.log("");
  console.log(st.dim(`  consilium debug <id>   consilium logs <id>`));
  console.log("");
}

export async function cancelDebateCommand(
  debateId: string,
  options: { deliberation?: boolean } = {},
): Promise<void> {
  await requireAuth();
  const client = new ConsiliumClient();
  try {
    if (options.deliberation) {
      await client.cancelDeliberation(debateId);
    } else {
      await client.cancelDebate(debateId);
    }
    console.log(st.success(`Cancelled ${debateId}`));
  } catch (err) {
    console.error(st.error(`Cancel failed: ${(err as Error).message}`));
    process.exitCode = 1;
  }
}
