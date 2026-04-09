export type DebateMode = 'quick' | 'council' | 'deep' | 'blind' | 'redteam' | 'jury' | 'market' | 'auto';

export interface DebateModeConfig {
  rounds: number;
  subAgents: boolean;
  estimatedCost: number;
  description: string;
  estimatedTime: string;
}

export interface CostEstimate {
  total: number;
  breakdown: {
    perRound: number;
    judge: number;
    subAgents?: number;
  };
  estimatedTime: string;
}

export const DEBATE_MODES: Record<DebateMode, DebateModeConfig> = {
  quick: {
    rounds: 1,
    subAgents: false,
    estimatedCost: 0.01,
    description: 'Single round, fastest response',
    estimatedTime: '~15s',
  },
  council: {
    rounds: 3,
    subAgents: false,
    estimatedCost: 0.04,
    description: 'Multi-round deliberation',
    estimatedTime: '~45s',
  },
  deep: {
    rounds: 3,
    subAgents: true,
    estimatedCost: 0.08,
    description: 'Multi-round with sub-agent research',
    estimatedTime: '~90s',
  },
  blind: {
    rounds: 3,
    subAgents: false,
    estimatedCost: 0.04,
    description: 'Names hidden until scored',
    estimatedTime: '~45s',
  },
  redteam: {
    rounds: 4,
    subAgents: true,
    estimatedCost: 0.10,
    description: 'Adversarial red team assessment',
    estimatedTime: '~120s',
  },
  jury: {
    rounds: 3,
    subAgents: false,
    estimatedCost: 0.05,
    description: 'Panel deliberation with voting',
    estimatedTime: '~60s',
  },
  market: {
    rounds: 5,
    subAgents: true,
    estimatedCost: 0.09,
    description: 'Prediction market style confidence aggregation',
    estimatedTime: '~90s',
  },
  auto: {
    rounds: 3,
    subAgents: false,
    estimatedCost: 0.04,
    description: 'Automatically selects best mode for topic',
    estimatedTime: '~45s',
  },
};

export const ALL_MODES = Object.keys(DEBATE_MODES) as DebateMode[];

export function isValidMode(mode: string): mode is DebateMode {
  return mode in DEBATE_MODES;
}

export function getDefaultMode(): DebateMode {
  return 'auto';
}

export function estimateCost(mode: DebateMode, modelCount: number): CostEstimate {
  const config = DEBATE_MODES[mode];
  const baseCostPerModel = config.estimatedCost / 3;
  const perRound = baseCostPerModel * modelCount;
  const judge = perRound * 0.5;
  const subAgents = config.subAgents ? perRound * modelCount * 0.3 : undefined;

  const total = (perRound * config.rounds) + judge + (subAgents ?? 0);

  const timeMultiplier = modelCount / 3;
  const baseMinutes = config.subAgents ? 1.5 : config.rounds === 1 ? 0.25 : 0.75;
  const minutes = Math.ceil(baseMinutes * timeMultiplier * 60);

  return {
    total: Math.round(total * 1000) / 1000,
    breakdown: {
      perRound: Math.round(perRound * 1000) / 1000,
      judge: Math.round(judge * 1000) / 1000,
      ...(subAgents !== undefined && { subAgents: Math.round(subAgents * 1000) / 1000 }),
    },
    estimatedTime: `~${minutes}s`,
  };
}

export function formatCostEstimate(estimate: CostEstimate): string {
  const lines = [
    `Estimated cost: $${estimate.total.toFixed(3)}`,
    `  Per round:    $${estimate.breakdown.perRound.toFixed(3)}`,
    `  Judge:        $${estimate.breakdown.judge.toFixed(3)}`,
  ];

  if (estimate.breakdown.subAgents !== undefined) {
    lines.push(`  Sub-agents:   $${estimate.breakdown.subAgents.toFixed(3)}`);
  }

  lines.push(`  Time:         ${estimate.estimatedTime}`);

  return lines.join('\n');
}
