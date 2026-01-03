"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function CostBreakdown() {
  // TODO: Implement with Recharts
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost by Model</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">
          Cost breakdown will be displayed here
        </p>
      </CardContent>
    </Card>
  );
}
