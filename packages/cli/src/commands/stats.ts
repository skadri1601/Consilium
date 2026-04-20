import { ConsiliumClient } from '../api/client';
import { requireAuth } from '../utils/require-auth';
import { style, border, borderBottom, contentLine } from '../utils/visual-system';

const st = style();

interface StatsResponse {
  totalDebates: number;
  totalCost: number;
  thisMonthCount: number;
  avgCost: number;
  modelUsage: Record<string, number>;
}

function formatCost(cost: number | undefined): string {
  if (cost === undefined || cost === null) return '$0.00';
  return `$${cost.toFixed(4)}`;
}

async function fetchStats(client: ConsiliumClient): Promise<StatsResponse | null> {
  try {
    const apiUrl = client.getApiUrl();
    const response = await fetch(`${apiUrl}/api/v1/analytics/stats`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return response.json() as Promise<StatsResponse>;
  } catch (err: unknown) {
    console.error(st.dim(`Stats fetch error: ${err instanceof Error ? err.message : String(err)}`));
    return null;
  }
}

export async function statsCommand(): Promise<void> {
  await requireAuth();

  const client = new ConsiliumClient();
  const stats = await fetchStats(client);

  if (!stats) {
    console.log(st.error('Failed to fetch stats from API.'));
    console.log(st.dim('Make sure the API is running and accessible.'));
    return;
  }

  console.log(border('Model Performance Dashboard'));
  console.log(contentLine(`Total Debates:     ${stats.totalDebates}`));
  console.log(contentLine(`Total Cost:        ${formatCost(stats.totalCost)}`));
  console.log(contentLine(`This Month:        ${stats.thisMonthCount}`));
  console.log(contentLine(`Avg Cost/Debate:   ${formatCost(stats.avgCost)}`));
  console.log(borderBottom());

  const modelUsage = stats.modelUsage || {};
  const models = Object.entries(modelUsage).sort((a, b) => b[1] - a[1]);

  if (models.length > 0) {
    console.log('');
    console.log(border('Model Usage Breakdown'));
    const top = models[0];
    const maxCount = top ? top[1] : 0;
    for (const [model, count] of models) {
      const barLen = maxCount > 0 ? Math.round((count / maxCount) * 20) : 0;
      const bar = '\u2588'.repeat(barLen) + '\u2591'.repeat(20 - barLen);
      console.log(contentLine(`${model.padEnd(20)} ${bar} ${count}`));
    }
    console.log(borderBottom());
  }
}
