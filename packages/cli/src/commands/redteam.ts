import { ConsiliumClient, DeliberationEvent } from '../api/client';
import { requireAuth } from '../utils/require-auth';
import { style } from '../utils/visual-system';
import { terminal } from '../utils/terminal-capabilities';
import { log } from '../utils/logger';
import logUpdate from 'log-update';

const st = style();

export interface RedTeamCommandOptions {
  models?: string[];
  categories?: string[];
}

export async function redteamCommand(
  content: string,
  options: RedTeamCommandOptions
): Promise<void> {
  requireAuth();

  const client = new ConsiliumClient();
  const useLiveProgress = terminal.isTTY && !terminal.usePlain;
  const startTime = Date.now();

  console.log(st.brand('\n  Red Team Assessment\n'));

  const isHealthy = await client.healthCheck();
  if (!isHealthy) {
    console.log(st.error('API is not available'));
    process.exit(1);
  }

  let assessment: { id: string };
  try {
    assessment = await client.createRedTeam(content, {
      models: options.models,
      categories: options.categories,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Create failed';
    log('ERROR', 'redteam_failed', { error: msg });
    console.log(st.error('Red team creation failed: ' + msg));
    process.exit(1);
  }

  log('INFO', 'redteam_started', { debateId: assessment.id });

  let currentPhase = '';
  const findings: string[] = [];
  let resultText = '';
  const costs: Array<{ model: string; tokens: number; cost: number }> = [];

  try {
    await client.streamDeliberation(assessment.id, (event: DeliberationEvent) => {
      switch (event.type) {
        case 'phase_change':
          currentPhase = event.phase || '';
          if (useLiveProgress) {
            logUpdate(st.brand(`  Phase: ${currentPhase}...`));
          } else {
            console.log(st.brand(`  ${currentPhase}...`));
          }
          break;

        case 'model_progress':
          if (useLiveProgress && event.agent && event.progress !== undefined) {
            const pct = Math.round(event.progress);
            logUpdate(st.brand(`  Phase: ${currentPhase}...`) + `\n  ${event.agent}: ${pct}%`);
          }
          break;

        case 'dissent_detected':
          if (event.dissent) {
            findings.push(`${event.dissent.agent}: ${event.dissent.reason}`);
            if (!useLiveProgress) {
              console.log(st.warning(`  Finding: ${event.dissent.agent} - ${event.dissent.reason}`));
            }
          }
          break;

        case 'cost_update':
          if (event.cost) costs.push(event.cost);
          break;

        case 'deliberation_complete':
          if (event.text) resultText = event.text;
          if (useLiveProgress) logUpdate.clear();
          break;

        case 'error':
          if (useLiveProgress) logUpdate.clear();
          throw new Error(event.error || 'Red team error');
      }
    });
  } catch (error: unknown) {
    if (useLiveProgress) logUpdate.clear();
    const msg = error instanceof Error ? error.message : 'Unknown error';
    log('ERROR', 'redteam_failed', { debateId: assessment.id, error: msg, durationMs: Date.now() - startTime });
    console.log(st.error('\n  Error: ' + msg + '\n'));
    process.exit(1);
  }

  log('INFO', 'redteam_completed', { debateId: assessment.id, durationMs: Date.now() - startTime });

  if (resultText) {
    console.log('\n' + resultText);
  }

  if (findings.length > 0) {
    console.log(st.warning(`\n  ${findings.length} finding(s) detected`));
  }

  if (costs.length > 0) {
    console.log(st.dim('\n  Cost breakdown:'));
    let total = 0;
    for (const c of costs) {
      total += c.cost;
      console.log(st.dim(`    ${c.model.padEnd(28)} ${c.tokens.toLocaleString()} tokens  $${c.cost.toFixed(4)}`));
    }
    console.log(st.dim(`    ${'Total'.padEnd(28)} $${total.toFixed(4)}`));
  }

  console.log(st.success('\nRed team assessment complete.\n'));
}
