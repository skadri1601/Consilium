"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useCostByModel } from "../hooks/use-analytics";

const COLORS = [
  "rgb(var(--warm))",
  "rgb(var(--agree))",
  "rgb(var(--warm-bright))",
  "rgb(var(--dissent))",
  "rgb(var(--ink-secondary))",
  "rgb(var(--ink-tertiary))",
];

function prettifyName(name: string): string {
  return name
    .replace("gpt-", "GPT-")
    .replace("claude-", "Claude ")
    .replace("gemini-", "Gemini ");
}

function Shell({
  children,
  description,
}: {
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="mb-4">
        <div className="eyebrow">Breakdown</div>
        <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
          Cost by model
        </h3>
        {description && (
          <p className="text-[12px] text-ink-tertiary mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function CostBreakdown() {
  const { costByModel, isLoading, error } = useCostByModel();

  if (error) {
    return (
      <Shell>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-[13px] text-dissent">
            Error loading cost data: {error}
          </p>
        </div>
      </Shell>
    );
  }

  if (isLoading || !costByModel) {
    return (
      <Shell>
        <div className="h-[300px] flex items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">
            Loading cost breakdown…
          </p>
        </div>
      </Shell>
    );
  }

  const chartData = Object.entries(costByModel).map(([model, cost]) => ({
    name: model,
    value: cost,
  }));

  const totalCost = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0 || totalCost === 0) {
    return (
      <Shell description="Distribution of costs across models">
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-[13px] text-ink-tertiary">
            No cost data available yet.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell description={`Total spend: $${totalCost.toFixed(4)}`}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${prettifyName(name)} (${(percent * 100).toFixed(1)}%)`
            }
            outerRadius={80}
            dataKey="value"
            stroke="rgb(var(--bg-1))"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--bg-1))",
              border: "1px solid rgb(255 255 255 / 0.08)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "rgb(var(--ink-primary))",
            }}
            formatter={(value: number) => [`$${value.toFixed(4)}`, "Cost"]}
            labelFormatter={(label) => prettifyName(label.toString())}
          />
          <Legend
            formatter={(value) => (
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-secondary">
                {prettifyName(value.toString())}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Shell>
  );
}
