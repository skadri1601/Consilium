"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function UsageChart() {
  // TODO: Implement with Recharts
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">
          Chart will be displayed here
        </p>
      </CardContent>
    </Card>
  );
}
