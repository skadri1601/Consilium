import wrapAnsi from 'wrap-ansi';
import { DebateEvent } from '../api/client';
import {
  border,
  borderBottom,
  borderLine,
  contentLine,
  borderRounded,
  borderBottomRounded,
  borderLineRounded,
  contentLineRounded,
  style,
} from './visual-system';
import { typography } from './typography';
import { terminal } from './terminal-capabilities';
import { updateLine, clearAndPersist, stopUpdates } from './animation-controller';

const st = style();
const W = () => terminal.width;
const BAR_LEN = 24;

interface AgentCardState {
  name: string;
  status: 'thinking' | 'done';
  content: string;
  startTime: number;
  durationMs?: number;
}

function progressBar(percent: number, durationSec?: number): string {
  const filled = Math.round((BAR_LEN * Math.min(100, Math.max(0, percent))) / 100);
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_LEN - filled);
  const pct = `${Math.round(percent)}%`;
  const time = durationSec != null ? ` • ${durationSec.toFixed(1)}s` : '';
  return `[${bar}] ${pct}${time}`;
}

function renderAgentCard(card: AgentCardState, w: number): string[] {
  const lines: string[] = [];
  lines.push(borderRounded(card.name, w));
  lines.push(borderLineRounded(w));

  const statusLine =
    card.status === 'done'
      ? `${st.success('✓')} Complete`
      : `${st.dim('⠸')} Analyzing...`;
  lines.push(contentLineRounded(statusLine, w));
  lines.push(contentLineRounded('', w));

  const contentW = w - 4;
  const wrapped = wrapAnsi(card.content || '', contentW, { hard: true });
  const contentLines = wrapped ? wrapped.split('\n') : [];
  for (const line of contentLines.slice(0, 20)) {
    lines.push(contentLineRounded(line || ' ', w));
  }
  if (contentLines.length > 20) {
    lines.push(contentLineRounded('…', w));
  }
  lines.push(contentLineRounded('', w));

  const percent = card.status === 'done' ? 100 : Math.min(95, ((Date.now() - card.startTime) / 1000) * 25);
  const durationSec = card.durationMs != null ? card.durationMs / 1000 : undefined;
  lines.push(contentLineRounded(progressBar(percent, durationSec), w));
  lines.push(borderBottomRounded(w));
  return lines;
}

export interface StreamRenderOptions {
  onComplete?: () => void;
  /** Topic for the debate header (used when API does not send it in debate_start) */
  topic?: string;
}

/**
 * Professional streaming layout: boxed debate header, agent cards with progress,
 * Synthesis section. Uses log-update for flicker-free streaming.
 */
export function createStreamHandlers(options: StreamRenderOptions = {}) {
  let topic = '';
  let agentCount = 0;
  const agents: AgentCardState[] = [];
  let currentIndex = -1;
  let consensusText = '';
  let debateStartTime = 0;
  let useLiveUpdate = terminal.isTTY && !terminal.usePlain;

  function buildFrame(): string {
    const w = W();
    const parts: string[] = [];

    parts.push(st.dim('\n' + border('Consilium Debate', w)));
    const statusLine = `  Topic: ${(topic || '…').slice(0, 50)}${topic.length > 50 ? '…' : ''}`;
    const agentPart = agentCount > 0 ? `Agents: ${agentCount}` : 'Agents: …';
    const statusPart = consensusText ? 'Complete' : 'In Progress';
    parts.push(contentLine(`  ${statusLine.trim()}`, w));
    parts.push(contentLine(`  ${agentPart} • Status: ${statusPart}`, w));
    parts.push(st.dim(borderBottom(w)) + '\n');

    for (const card of agents) {
      parts.push(renderAgentCard(card, w).join('\n') + '\n');
    }

    if (consensusText) {
      parts.push(st.dim(border('Synthesis', w)));
      parts.push(borderLine(w));
      const lines = consensusText.split(/\n/);
      for (const line of lines) {
        parts.push(contentLine(line || ' ', w));
      }
      parts.push(st.dim(borderBottom(w)) + '\n');
    }

    return parts.join('\n');
  }

  function flushFinal() {
    if (!useLiveUpdate) return;
    stopUpdates();
    const w = W();
    const parts: string[] = [];
    parts.push(st.dim('\n' + border('Consilium Debate', w)));
    parts.push(contentLine(`  Topic: ${(topic || '…').slice(0, 60)}`, w));
    parts.push(contentLine(`  Agents: ${agents.length} • Status: Complete`, w));
    parts.push(st.dim(borderBottom(w)) + '\n');
    for (const card of agents) {
      parts.push(renderAgentCard(card, w).join('\n') + '\n');
    }
    if (consensusText) {
      parts.push(st.dim(border('Synthesis', w)));
      parts.push(borderLine(w));
      for (const line of consensusText.split(/\n/)) {
        parts.push(contentLine(line || ' ', w));
      }
      parts.push(st.dim(borderBottom(w)) + '\n');
    }
    process.stdout.write(parts.join('\n'));
  }

  return function handleEvent(event: DebateEvent): void {
    switch (event.type) {
      case 'debate_start': {
        debateStartTime = Date.now();
        topic = event.text || options.topic || '';
        if (!useLiveUpdate) {
          console.log(st.dim('\n' + border('Consilium Debate', W())));
          console.log(borderLine(W()));
          console.log(contentLine(`  Topic: ${(topic || '…').slice(0, 60)}`, W()));
          console.log(contentLine('  Agents: … • Status: In Progress', W()));
          console.log(st.dim(borderBottom(W())) + '\n');
        }
        break;
      }

      case 'agent_start': {
        const name = event.agent || 'Unknown';
        agentCount = Math.max(agentCount, agents.length + 1);
        agents.push({
          name,
          status: 'thinking',
          content: '',
          startTime: Date.now(),
        });
        currentIndex = agents.length - 1;
        if (useLiveUpdate) {
          updateLine(buildFrame());
        } else {
          const label = (event.agent || 'Unknown').padEnd(22);
          console.log(typography.agent('  ⠸ ' + label) + st.dim(' thinking…'));
          console.log(st.dim('  │ '));
        }
        break;
      }

      case 'agent_chunk': {
        if (event.text && currentIndex >= 0 && currentIndex < agents.length) {
          agents[currentIndex].content += event.text;
          if (useLiveUpdate) {
            updateLine(buildFrame());
          } else {
            process.stdout.write(st.dim(event.text));
          }
        }
        break;
      }

      case 'agent_complete': {
        if (currentIndex >= 0 && currentIndex < agents.length) {
          const card = agents[currentIndex];
          card.status = 'done';
          card.durationMs = Date.now() - card.startTime;
        }
        if (useLiveUpdate) {
          updateLine(buildFrame());
        } else {
          const label = (agents[currentIndex]?.name || 'Unknown').padEnd(22);
          console.log(st.dim('  └─ ') + st.success('✓ ' + label + ' done'));
          console.log('');
        }
        currentIndex = -1;
        break;
      }

      case 'consensus': {
        if (event.text) consensusText = event.text;
        if (useLiveUpdate) {
          flushFinal();
          process.stdout.write(st.success('  ✓ Debate complete.\n\n'));
        } else {
          console.log(st.dim('\n' + border('Synthesis', W())));
          console.log(borderLine(W()));
          for (const line of (event.text || '').split(/\n/)) {
            console.log(contentLine(line || ' ', W()));
          }
          console.log(st.dim(borderBottom(W())) + '\n');
          console.log(st.success('  ✓ Debate complete.\n'));
        }
        options.onComplete?.();
        break;
      }

      case 'done': {
        if (useLiveUpdate && !consensusText) flushFinal();
        if (!useLiveUpdate) console.log(st.success('  ✓ Debate complete.\n'));
        options.onComplete?.();
        break;
      }

      case 'error': {
        if (useLiveUpdate) stopUpdates();
        console.log(st.error('\n  ✗ Error: ' + (event.error || 'Unknown error') + '\n'));
        throw new Error(event.error || 'Unknown error');
      }

      default:
        break;
    }
  };
}
