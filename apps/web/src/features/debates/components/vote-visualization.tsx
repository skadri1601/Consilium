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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
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

const RANK_COLORS: Record<number, string> = {
  0: "#D4AF37",
  1: "#C0C0C0",
  2: "#CD7F32",
};

function getRankColor(index: number): string {
  return RANK_COLORS[index] ?? `hsl(220, 10%, ${65 - index * 5}%)`;
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
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
        confident
          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
      )}
    >
      {confident ? (
        <Shield className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {method === "condorcet" ? "Condorcet Winner" : "Ranked Pairs"}
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Final Rankings</CardTitle>
          </div>
          <MethodBadge method={result.method} confident={result.confident} />
        </div>
        <CardDescription>
          Borda scores from {ballots.length} ballot
          {ballots.length === 1 ? "" : "s"} (avg confidence:{" "}
          {(avgConfidence * 100).toFixed(0)}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={Math.max(200, result.fullRanking.length * 50)}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={120}
            />
            <Tooltip
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
      </CardContent>
    </Card>
  );
}

function WinnerBanner({ result }: Readonly<{ result: AggregationResult }>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Winner
          </p>
          <p className="text-lg font-bold">{result.winner}</p>
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Individual Ballots</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ballots.map((ballot) => (
            <motion.div
              key={ballot.voterId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold truncate">
                  {ballot.voterId}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(ballot.confidenceWeight * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(ballot.confidenceWeight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <ol className="space-y-1">
                {ballot.rankedChoices.map((choice, rank) => (
                  <li key={choice} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: getRankColor(rank),
                        color: rank < 3 ? "#fff" : "inherit",
                        opacity: getRankBarOpacity(
                          rank,
                          ballot.rankedChoices.length,
                        ),
                      }}
                    >
                      {rank + 1}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {choice}
                    </span>
                  </li>
                ))}
              </ol>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Pairwise Comparison Matrix</CardTitle>
        <CardDescription>
          Weighted wins: row model vs column model
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left font-semibold text-muted-foreground">
                vs
              </th>
              {candidates.map((c) => (
                <th
                  key={c}
                  className={cn(
                    "p-2 text-center font-semibold",
                    c === result.winner && "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((a) => (
              <tr key={a} className="border-t border-border/50">
                <td
                  className={cn(
                    "p-2 font-semibold",
                    a === result.winner && "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {a}
                </td>
                {candidates.map((b) => {
                  if (a === b) {
                    return (
                      <td
                        key={b}
                        className="p-2 text-center bg-muted/50 text-muted-foreground"
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
                        won &&
                          "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400",
                        !won &&
                          !tied &&
                          "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400",
                        tied && "bg-muted/30 text-muted-foreground",
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
      </CardContent>
    </Card>
  );
}

function AggregationSteps({
  steps,
}: Readonly<{
  steps: AggregationStep[];
}>) {
  if (steps.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Aggregation Steps</CardTitle>
        <CardDescription>
          How Ranked Pairs locked in pairwise victories
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  "mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  step.locked
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <div className="text-sm">
                <span className="text-muted-foreground">
                  {step.description}
                </span>
                {step.pair && (
                  <span className="ml-2 font-mono text-xs">
                    {step.pair[0]} {">"} {step.pair[1]}
                    {step.margin != null && (
                      <span className="text-muted-foreground ml-1">
                        (margin: {step.margin.toFixed(2)})
                      </span>
                    )}
                  </span>
                )}
                {step.locked === false && (
                  <span className="ml-2 text-[10px] font-semibold text-red-500 uppercase">
                    cycle - skipped
                  </span>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function VoteVisualization({
  ballots,
  result,
  aggregationSteps,
}: Readonly<VoteVisualizationProps>) {
  if (result.fullRanking.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No voting data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (result.fullRanking.length === 1) {
    return (
      <div className="space-y-4">
        <WinnerBanner result={result} />
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Single candidate - no vote aggregation needed.
            </p>
          </CardContent>
        </Card>
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
