"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { DollarSign, TrendingDown, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getAgentDisplayName } from "../utils/council-helpers";

interface ModelCost {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface RoundCost {
  round: number;
  cost: number;
}

interface CostData {
  totalCost: number;
  modelCosts: ModelCost[];
  roundCosts: RoundCost[];
  singleModelEstimate?: number;
}

interface CostTrackerProps {
  debateId: string;
  initialCost?: CostData;
  streaming?: boolean;
}

const MODEL_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(270, 70%, 55%)",
  "hsl(350, 80%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(var(--primary))",
];

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

export function CostTracker({ debateId, initialCost, streaming = false }: CostTrackerProps) {
  const [costData, setCostData] = useState<CostData>(
    initialCost ?? { totalCost: 0, modelCosts: [], roundCosts: [] }
  );
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!streaming || !debateId) return;

    const eventSource = new EventSource(`/api/debates/${debateId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventName = (data.event || "").replace(/_/g, ":");

        if (eventName === "cost:update") {
          setCostData((prev) => ({
            totalCost: data.totalCost ?? data.total_cost ?? prev.totalCost,
            modelCosts: data.modelCosts ?? data.model_costs ?? prev.modelCosts,
            roundCosts: data.roundCosts ?? data.round_costs ?? prev.roundCosts,
            singleModelEstimate:
              data.singleModelEstimate ?? data.single_model_estimate ?? prev.singleModelEstimate,
          }));
        }
      } catch {}
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [debateId, streaming]);

  const totalTokensIn = useMemo(
    () => costData.modelCosts.reduce((sum, m) => sum + m.inputTokens, 0),
    [costData.modelCosts]
  );

  const totalTokensOut = useMemo(
    () => costData.modelCosts.reduce((sum, m) => sum + m.outputTokens, 0),
    [costData.modelCosts]
  );

  const savings = useMemo(() => {
    if (!costData.singleModelEstimate || costData.singleModelEstimate <= 0) return null;
    const ratio = costData.singleModelEstimate / Math.max(costData.totalCost, 0.0001);
    return { ratio, saved: costData.singleModelEstimate - costData.totalCost };
  }, [costData.totalCost, costData.singleModelEstimate]);

  const modelChartData = useMemo(
    () =>
      costData.modelCosts.map((m) => ({
        name: getAgentDisplayName(m.modelId),
        cost: m.cost,
        modelId: m.modelId,
      })),
    [costData.modelCosts]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant={streaming ? "elevated" : "default"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Cost Tracker
              {streaming && (
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </CardTitle>
            <motion.span
              key={costData.totalCost}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold text-foreground"
            >
              {formatCost(costData.totalCost)}
            </motion.span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Tokens In</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-blue-500" />
                {formatTokens(totalTokensIn)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Tokens Out</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-purple-500" />
                {formatTokens(totalTokensOut)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Models</p>
              <p className="text-sm font-semibold">{costData.modelCosts.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Rounds</p>
              <p className="text-sm font-semibold">{costData.roundCosts.length}</p>
            </div>
          </div>

          <AnimatePresence>
            {savings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-lg border border-green-400/30 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      vs single-model: {formatCost(costData.singleModelEstimate!)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      savings.saved > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500"
                    )}
                  >
                    {savings.saved > 0 ? (
                      <span className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" />
                        {savings.ratio.toFixed(1)}x savings
                      </span>
                    ) : (
                      `+${formatCost(Math.abs(savings.saved))}`
                    )}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {modelChartData.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Per-Model Cost</p>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={modelChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      tickFormatter={(v) => formatCost(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [formatCost(value), "Cost"]}
                    />
                    <Bar dataKey="cost" radius={[0, 4, 4, 0]} animationDuration={600}>
                      {modelChartData.map((_entry, index) => (
                        <Cell
                          key={index}
                          fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {costData.roundCosts.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Per-Round Cost</p>
              <div className="flex gap-2">
                {costData.roundCosts.map((round, index) => {
                  const maxRoundCost = Math.max(
                    ...costData.roundCosts.map((r) => r.cost),
                    0.001
                  );
                  const height = Math.max((round.cost / maxRoundCost) * 40, 4);

                  return (
                    <motion.div
                      key={round.round}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center gap-1 flex-1"
                      style={{ originY: 1 }}
                    >
                      <div
                        className="w-full rounded-t bg-primary/60"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-[10px] text-muted-foreground">R{round.round}</span>
                      <span className="text-[10px] font-medium">{formatCost(round.cost)}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
