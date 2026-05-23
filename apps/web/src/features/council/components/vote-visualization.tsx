"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { Trophy, Award, Shield } from "lucide-react";
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
import { getAgentDisplayName } from "../utils/council-helpers";

interface VoteResult {
  modelId: string;
  bordaScore: number;
  rankings: number[];
  confidence: number;
  isCondorcetWinner?: boolean;
}

interface VoteVisualizationProps {
  votes: VoteResult[];
  winnerId?: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(270, 70%, 55%)",
  "hsl(350, 80%, 55%)",
  "hsl(38, 92%, 50%)",
];

export function VoteVisualization({ votes, winnerId }: VoteVisualizationProps) {
  const sortedVotes = useMemo(
    () => [...votes].sort((a, b) => b.bordaScore - a.bordaScore),
    [votes],
  );

  const chartData = useMemo(
    () =>
      sortedVotes.map((vote) => ({
        name: getAgentDisplayName(vote.modelId),
        score: vote.bordaScore,
        confidence: vote.confidence,
        modelId: vote.modelId,
      })),
    [sortedVotes],
  );

  const maxScore = useMemo(
    () => Math.max(...sortedVotes.map((v) => v.bordaScore), 1),
    [sortedVotes],
  );

  const condorcetWinner = useMemo(
    () => sortedVotes.find((v) => v.isCondorcetWinner),
    [sortedVotes],
  );

  if (votes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Vote Results
            </CardTitle>
            {condorcetWinner && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1"
              >
                <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Condorcet Winner:{" "}
                  {getAgentDisplayName(condorcetWinner.modelId)}
                </span>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  domain={[0, Math.ceil(maxScore * 1.1)]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value, _name, props) => {
                    const numeric =
                      typeof value === "number" ? value : Number(value ?? 0);
                    const confidence =
                      (props as { payload?: { confidence?: number } })?.payload
                        ?.confidence ?? 0;
                    return [
                      `${numeric} pts (${Math.round(confidence * 100)}% confidence)`,
                      "Borda Score",
                    ];
                  }}
                />
                <Bar
                  dataKey="score"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.modelId}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      opacity={entry.modelId === winnerId ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {sortedVotes.map((vote, index) => {
                const isWinner = vote.modelId === winnerId;
                const barWidth = (vote.bordaScore / maxScore) * 100;

                return (
                  <motion.div
                    key={vote.modelId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "relative rounded-lg border p-3 transition-all",
                      isWinner
                        ? "border-amber-400/60 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20"
                        : "border-border bg-muted/20",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isWinner && (
                          <Award className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isWinner && "text-amber-700 dark:text-amber-300",
                          )}
                        >
                          {getAgentDisplayName(vote.modelId)}
                        </span>
                        {vote.isCondorcetWinner && (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-1.5 py-0.5">
                            Condorcet
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{vote.bordaScore} pts</span>
                        <span className="flex items-center gap-1">
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                vote.confidence > 0.7
                                  ? "hsl(142, 71%, 45%)"
                                  : vote.confidence > 0.4
                                    ? "hsl(38, 92%, 50%)"
                                    : "hsl(350, 80%, 55%)",
                            }}
                          />
                          {Math.round(vote.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[index % CHART_COLORS.length],
                          opacity: isWinner ? 1 : 0.6,
                        }}
                      />
                    </div>
                    {vote.rankings.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {vote.rankings.map((rank, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-muted rounded px-1 py-0.5 text-muted-foreground"
                          >
                            R{i + 1}: #{rank}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
