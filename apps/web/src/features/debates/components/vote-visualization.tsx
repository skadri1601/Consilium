"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Trophy, ClipboardList, Shield, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface RankedBallot {
  voterId: string;
  rankedChoices: string[];
  confidenceWeight: number;
}

interface AggregationStep {
  description: string;
  pair?: [string, string];
  margin?: number;
  locked?: boolean;
}

interface AggregationResult {
  winner: string;
  fullRanking: string[];
  method: "condorcet" | "ranked_pairs";
  confident: boolean;
  scores: Record<string, number>;
}

export interface VoteVisualizationProps {
  ballots: RankedBallot[];
  result: AggregationResult;
  aggregationSteps?: AggregationStep[];
}

const RANK_COLORS = [
  "rgb(var(--warm))",
  "rgb(var(--agree))",
  "rgb(var(--warm-bright))",
  "rgb(var(--ink-secondary))",
  "rgb(var(--ink-tertiary))",
];

function getRankColor(index: number): string {
  return RANK_COLORS[Math.min(index, RANK_COLORS.length - 1)];
}

function getRankBarOpacity(
  index: number,
  total: number,
  confidenceWeight?: number,
): number {
  const base = 1 - index * (0.6 / Math.max(total - 1, 1));
  if (confidenceWeight != null) {
    return Math.max(0.3, base * confidenceWeight);
  }
  return Math.max(0.3, base);
}

function MethodBadge({
  method,
  confident,
}: Readonly<{
  method: AggregationResult["method"];
  confident: boolean;
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full border",
        confident
          ? "bg-agree/14 text-agree border-agree/30"
          : "bg-warm/12 text-warm border-warm/30",
      )}
    >
      {confident ? (
        <Shield className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {method === "condorcet" ? "Condorcet winner" : "Ranked pairs"}
    </span>
  );
}

function RankingChart({
  result,
  ballots,
}: Readonly<{
  result: AggregationResult;
  ballots: RankedBallot[];
}>) {
  const chartData = useMemo(() => {
    const maxScore = Math.max(...Object.values(result.scores), 1);
    return result.fullRanking.map((model, index) => ({
      name: model,
      score: result.scores[model] ?? 0,
      normalized: ((result.scores[model] ?? 0) / maxScore) * 100,
      rank: index + 1,
      isWinner: model === result.winner,
      fill: getRankColor(index),
    }));
  }, [result]);

  const avgConfidence = useMemo(() => {
    if (ballots.length === 0) return 0;
    return (
      ballots.reduce((sum, b) => sum + b.confidenceWeight, 0) / ballots.length
    );
  }, [ballots]);

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warm" />
          <div>
            <div className="eyebrow">Rankings</div>
            <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
              Final standings
            </h3>
          </div>
        </div>
        <MethodBadge method={result.method} confident={result.confident} />
      </div>
      <p className="text-[12px] text-ink-tertiary mb-4">
        Borda scores from {ballots.length} ballot
        {ballots.length === 1 ? "" : "s"} · avg confidence{" "}
        {(avgConfidence * 100).toFixed(0)}%
      </p>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, result.fullRanking.length * 50)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="rgb(255 255 255 / 0.06)"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
            stroke="rgb(255 255 255 / 0.08)"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
            stroke="rgb(255 255 255 / 0.08)"
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--bg-1))",
              border: "1px solid rgb(255 255 255 / 0.08)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "rgb(var(--ink-primary))",
            }}
            formatter={(value: number, _name: string, props: any) => [
              `${value.toFixed(2)} (Rank #${props.payload.rank})`,
              "Borda Score",
            ]}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.fill}
                opacity={getRankBarOpacity(index, chartData.length)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WinnerBanner({ result }: Readonly<{ result: AggregationResult }>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative surface-card border-warm/30 bg-warm/6 p-4"
    >
      <span className="absolute -top-px left-0 h-px w-full bg-warm" />
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full border border-warm/40 bg-warm/14 text-warm flex items-center justify-center shrink-0">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-warm">
            Winner
          </p>
          <p className="font-display text-[20px] tracking-[-0.01em] text-ink-primary italic">
            {result.winner}
          </p>
        </div>
        <div className="ml-auto">
          <MethodBadge method={result.method} confident={result.confident} />
        </div>
      </div>
    </motion.div>
  );
}

function BallotList({ ballots }: Readonly<{ ballots: RankedBallot[] }>) {
  if (ballots.length === 0) return null;

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="h-4 w-4 text-warm" />
        <div>
          <div className="eyebrow">Ballots</div>
          <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
            Individual ballots
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ballots.map((ballot) => (
          <motion.div
            key={ballot.voterId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-[13px] tracking-[-0.01em] text-ink-primary truncate">
                {ballot.voterId}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-12 rounded-full bg-bg-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warm"
                    style={{
                      width: `${Math.min(ballot.confidenceWeight * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                  {(ballot.confidenceWeight * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <ol className="space-y-1">
              {ballot.rankedChoices.map((choice, rank) => (
                <li
                  key={choice}
                  className="flex items-center gap-2 text-[12px]"
                >
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 text-bg-0"
                    style={{
                      backgroundColor: getRankColor(rank),
                      opacity: getRankBarOpacity(
                        rank,
                        ballot.rankedChoices.length,
                      ),
                    }}
                  >
                    {rank + 1}
                  </span>
                  <span className="text-ink-secondary truncate">{choice}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PairwiseMatrix({
  ballots,
  result,
}: Readonly<{
  ballots: RankedBallot[];
  result: AggregationResult;
}>) {
  const { candidates, matrix } = useMemo(() => {
    const cands = result.fullRanking;
    const m: Record<string, Record<string, number>> = {};
    for (const a of cands) {
      m[a] = {};
      for (const b of cands) {
        m[a][b] = 0;
      }
    }
    for (const ballot of ballots) {
      for (let i = 0; i < ballot.rankedChoices.length; i++) {
        for (let j = i + 1; j < ballot.rankedChoices.length; j++) {
          const a = ballot.rankedChoices[i];
          const b = ballot.rankedChoices[j];
          const row = m[a];
          if (row?.[b] !== undefined) {
            row[b] += ballot.confidenceWeight;
          }
        }
      }
    }
    return { candidates: cands, matrix: m };
  }, [ballots, result.fullRanking]);

  if (candidates.length <= 1) return null;

  return (
    <div className="surface-card p-5">
      <div className="mb-4">
        <div className="eyebrow">Pairwise</div>
        <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
          Comparison matrix
        </h3>
        <p className="text-[12px] text-ink-tertiary mt-1">
          Weighted wins: row model vs column model
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <th className="p-2 text-left font-mono uppercase tracking-[0.06em] text-ink-tertiary">
                vs
              </th>
              {candidates.map((c) => (
                <th
                  key={c}
                  className={cn(
                    "p-2 text-center font-mono uppercase tracking-[0.06em]",
                    c === result.winner ? "text-warm" : "text-ink-tertiary",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((a) => (
              <tr key={a} className="border-t border-white/[0.06]">
                <td
                  className={cn(
                    "p-2 font-display text-[13px] tracking-[-0.01em]",
                    a === result.winner
                      ? "text-warm italic"
                      : "text-ink-primary",
                  )}
                >
                  {a}
                </td>
                {candidates.map((b) => {
                  if (a === b) {
                    return (
                      <td
                        key={b}
                        className="p-2 text-center bg-bg-2 text-ink-muted"
                      >
                        -
                      </td>
                    );
                  }
                  const aWins = matrix[a]?.[b] ?? 0;
                  const bWins = matrix[b]?.[a] ?? 0;
                  const won = aWins > bWins;
                  const tied = aWins === bWins;
                  return (
                    <td
                      key={b}
                      className={cn(
                        "p-2 text-center font-mono",
                        won && "bg-agree/10 text-agree",
                        !won && !tied && "bg-dissent/10 text-dissent",
                        tied && "bg-bg-2 text-ink-tertiary",
                      )}
                    >
                      {aWins.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AggregationSteps({
  steps,
}: Readonly<{
  steps: AggregationStep[];
}>) {
  if (steps.length === 0) return null;

  return (
    <div className="surface-card p-5">
      <div className="mb-4">
        <div className="eyebrow">Process</div>
        <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
          Aggregation steps
        </h3>
        <p className="text-[12px] text-ink-tertiary mt-1">
          How Ranked Pairs locked in pairwise victories
        </p>
      </div>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <motion.li
            key={`${index}-${step.description}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3"
          >
            <span
              className={cn(
                "mt-0.5 h-5 w-5 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 border",
                step.locked
                  ? "bg-agree/14 text-agree border-agree/30"
                  : "bg-bg-2 text-ink-tertiary border-white/[0.08]",
              )}
            >
              {index + 1}
            </span>
            <div className="text-[13px]">
              <span className="text-ink-secondary">{step.description}</span>
              {step.pair && (
                <span className="ml-2 font-mono text-[11px] text-ink-primary">
                  {step.pair[0]} {">"} {step.pair[1]}
                  {step.margin != null && (
                    <span className="text-ink-tertiary ml-1">
                      (margin: {step.margin.toFixed(2)})
                    </span>
                  )}
                </span>
              )}
              {step.locked === false && (
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.08em] text-dissent">
                  cycle · skipped
                </span>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

export function VoteVisualization({
  ballots,
  result,
  aggregationSteps,
}: Readonly<VoteVisualizationProps>) {
  if (result.fullRanking.length === 0) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-[13px] text-ink-tertiary">
          No voting data available.
        </p>
      </div>
    );
  }

  if (result.fullRanking.length === 1) {
    return (
      <div className="space-y-4">
        <WinnerBanner result={result} />
        <div className="surface-card p-6 text-center">
          <p className="text-[13px] text-ink-tertiary">
            Single candidate — no vote aggregation needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WinnerBanner result={result} />
      <RankingChart result={result} ballots={ballots} />
      <PairwiseMatrix ballots={ballots} result={result} />
      {aggregationSteps && aggregationSteps.length > 0 && (
        <AggregationSteps steps={aggregationSteps} />
      )}
      <BallotList ballots={ballots} />
    </div>
  );
}
