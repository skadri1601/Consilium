"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export function CostBreakdown() {
  const { costByModel, isLoading, error } = useCostByModel();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost by Model</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-destructive">
            Error loading cost data: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !costByModel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost by Model</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading cost breakdown...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transform the data from Record<string, number> to array format for Recharts
  const chartData = Object.entries(costByModel).map(([model, cost]) => ({
    name: model,
    value: cost,
  }));

  // Calculate total cost for percentage calculations
  const totalCost = chartData.reduce((sum, item) => sum + item.value, 0);

  // If no data, show empty state
  if (chartData.length === 0 || totalCost === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost by Model</CardTitle>
          <CardDescription>Distribution of costs across models</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No cost data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost by Model</CardTitle>
        <CardDescription>
          Distribution of costs across models (Total: ${totalCost.toFixed(4)})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => {
                const name = String((entry as { name?: unknown }).name ?? "");
                const percent =
                  (entry as { percent?: number }).percent ?? 0;
                const percentage = (percent * 100).toFixed(1);
                const displayName = name
                  .replace("gpt-", "GPT-")
                  .replace("claude-", "Claude ")
                  .replace("gemini-", "Gemini ");
                return `${displayName} (${percentage}%)`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [
                `$${(typeof value === "number" ? value : 0).toFixed(4)}`,
                "Cost",
              ]}
              labelFormatter={(label) =>
                label
                  .toString()
                  .replace("gpt-", "GPT-")
                  .replace("claude-", "Claude ")
                  .replace("gemini-", "Gemini ")
              }
            />
            <Legend
              formatter={(value) =>
                value
                  .toString()
                  .replace("gpt-", "GPT-")
                  .replace("claude-", "Claude ")
                  .replace("gemini-", "Gemini ")
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
