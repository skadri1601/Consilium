"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useUsageHistory } from "../hooks/use-analytics";
import { Button } from "@/shared/components/ui/button";

type TimePeriod = 7 | 30 | 90;

export function UsageChart() {
  const [period, setPeriod] = useState<TimePeriod>(30);
  const { usageHistory, isLoading, error } = useUsageHistory(period);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-destructive">
            Error loading usage data: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !usageHistory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading usage data...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage Over Time</CardTitle>
            <CardDescription>Queries, tokens, and costs over the past {period} days</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(7)}
            >
              7d
            </Button>
            <Button
              variant={period === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(30)}
            >
              30d
            </Button>
            <Button
              variant={period === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(90)}
            >
              90d
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={usageHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number) => value.toLocaleString()}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="queries"
              stroke="#0088FE"
              strokeWidth={2}
              name="Queries"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tokens"
              stroke="#00C49F"
              strokeWidth={2}
              name="Tokens"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cost"
              stroke="#FFBB28"
              strokeWidth={2}
              name="Cost ($)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
