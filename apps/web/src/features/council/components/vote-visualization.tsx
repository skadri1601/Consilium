"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const BAR_COLORS = [
  "rgb(var(--warm))",
  "rgb(var(--agree))",
  "rgb(var(--dissent))",
  "rgb(var(--ink-tertiary))",
  "rgb(var(--warm-bright))",
  "rgb(var(--ink-secondary))",
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
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow">Scoring</div>
            <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warm" />
              Vote results
            </h3>
          </div>
          {condorcetWinner && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-warm/12 border border-warm/30 px-3 py-1"
            >
              <Shield className="h-3.5 w-3.5 text-warm" />
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-warm">
                Condorcet: {getAgentDisplayName(condorcetWinner.modelId)}
              </span>
            </motion.div>
          )}
        </div>

        <div className="mb-6 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgb(255 255 255 / 0.06)"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
                stroke="rgb(255 255 255 / 0.08)"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
                stroke="rgb(255 255 255 / 0.08)"
                domain={[0, Math.ceil(maxScore * 1.1)]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgb(var(--bg-1))",
                  border: "1px solid rgb(255 255 255 / 0.08)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "rgb(var(--ink-primary))",
                }}
                formatter={(
                  value: number,
                  _name: string,
                  props: { payload?: { confidence: number } },
                ) => [
                  `${value} pts (${Math.round((props.payload?.confidence ?? 0) * 100)}% confidence)`,
                  "Borda Score",
                ]}
              />
              <Bar
                dataKey="score"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.modelId}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                    opacity={entry.modelId === winnerId ? 1 : 0.6}
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
                    "relative rounded-[10px] border p-3 transition-all",
                    isWinner
                      ? "border-warm/40 bg-warm/10"
                      : "border-white/[0.08] bg-bg-1",
                  )}
                >
                  {isWinner && (
                    <span className="absolute -top-px left-0 h-px w-full bg-warm" />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <Award className="h-4 w-4 text-warm shrink-0" />
                      )}
                      <span
                        className={cn(
                          "font-display text-[14px] tracking-[-0.01em]",
                          isWinner ? "text-warm italic" : "text-ink-primary",
                        )}
                      >
                        {getAgentDisplayName(vote.modelId)}
                      </span>
                      {vote.isCondorcetWinner && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-warm bg-warm/12 border border-warm/30 rounded-full px-1.5 py-0.5">
                          Condorcet
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                      <span>{vote.bordaScore} pts</span>
                      <span className="flex items-center gap-1">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            vote.confidence > 0.7
                              ? "bg-agree"
                              : vote.confidence > 0.4
                                ? "bg-warm"
                                : "bg-dissent",
                          )}
                        />
                        {Math.round(vote.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-bg-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                        opacity: isWinner ? 1 : 0.5,
                      }}
                    />
                  </div>
                  {vote.rankings.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {vote.rankings.map((rank, i) => (
                        <span
                          key={i}
                          className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-tertiary bg-bg-2 border border-white/[0.06] rounded px-1.5 py-0.5"
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
      </div>
    </motion.div>
  );
}
