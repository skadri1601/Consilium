"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useUsageHistory } from "../hooks/use-analytics";
import { cn } from "@/shared/lib/utils";

type TimePeriod = 7 | 30 | 90;

function PeriodPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
        active
          ? "border-warm/40 bg-warm/12 text-warm"
          : "border-white/[0.08] bg-bg-1 text-ink-tertiary hover:text-ink-primary hover:border-white/[0.18]",
      )}
    >
      {label}
    </button>
  );
}

function Shell({
  children,
  description,
  right,
}: {
  children: React.ReactNode;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="eyebrow">Trend</div>
          <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
            Usage Over Time
          </h3>
          {description && (
            <p className="text-[12px] text-ink-tertiary mt-1">{description}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function UsageChart() {
  const [period, setPeriod] = useState<TimePeriod>(30);
  const { usageHistory, isLoading, error } = useUsageHistory(period);

  const periodControls = (
    <div className="flex gap-1.5">
      <PeriodPill
        label="7d"
        active={period === 7}
        onClick={() => setPeriod(7)}
      />
      <PeriodPill
        label="30d"
        active={period === 30}
        onClick={() => setPeriod(30)}
      />
      <PeriodPill
        label="90d"
        active={period === 90}
        onClick={() => setPeriod(90)}
      />
    </div>
  );

  if (error) {
    return (
      <Shell right={periodControls}>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-[13px] text-dissent">
            Error loading usage data: {error}
          </p>
        </div>
      </Shell>
    );
  }

  if (isLoading || !usageHistory) {
    return (
      <Shell right={periodControls}>
        <div className="h-[300px] flex items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">
            Loading usage data…
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      description={`Queries, tokens, and costs over the past ${period} days`}
      right={periodControls}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={usageHistory}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(255 255 255 / 0.06)"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
            stroke="rgb(255 255 255 / 0.08)"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
            stroke="rgb(255 255 255 / 0.08)"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
            stroke="rgb(255 255 255 / 0.08)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--bg-1))",
              border: "1px solid rgb(255 255 255 / 0.08)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "rgb(var(--ink-primary))",
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend
            formatter={(value) => (
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-secondary">
                {value}
              </span>
            )}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="queries"
            stroke="rgb(var(--warm))"
            strokeWidth={2}
            name="Queries"
            dot={{ r: 3, fill: "rgb(var(--warm))" }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="tokens"
            stroke="rgb(var(--agree))"
            strokeWidth={2}
            name="Tokens"
            dot={{ r: 3, fill: "rgb(var(--agree))" }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            stroke="rgb(var(--warm-bright))"
            strokeWidth={2}
            name="Cost ($)"
            dot={{ r: 3, fill: "rgb(var(--warm-bright))" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Shell>
  );
}
