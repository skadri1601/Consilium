"use client";

import { motion } from "framer-motion";
import { Scale, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { getAgentDisplayName } from "../utils/council-helpers";

interface DissentPoint {
  topic: string;
  majorityPosition: string;
  minorityPosition: string;
  significance: "low" | "medium" | "high";
}

interface OpinionHolder {
  modelId: string;
  summary: string;
  confidence: number;
  keyPoints: string[];
}

interface DissentReport {
  majority: OpinionHolder[];
  minority: OpinionHolder[];
  disagreements: DissentPoint[];
  consensusAreas: string[];
}

interface DissentViewProps {
  report: DissentReport;
}

function SignificanceBadge({ level }: { level: DissentPoint["significance"] }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
        level === "high" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
        level === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        level === "low" && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
      )}
    >
      {level}
    </span>
  );
}

function OpinionCard({
  holder,
  variant,
}: {
  holder: OpinionHolder;
  variant: "majority" | "minority";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border p-4",
        variant === "majority"
          ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/10"
          : "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold truncate">
          {getAgentDisplayName(holder.modelId)}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                variant === "majority" ? "bg-green-500" : "bg-amber-500"
              )}
              style={{ width: `${holder.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {(holder.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{holder.summary}</p>
      <ul className="space-y-1">
        {holder.keyPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function DissentView({ report }: DissentViewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Dissent Report</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-semibold">
                Majority Opinion ({report.majority.length})
              </h3>
            </div>
            <div className="space-y-3">
              {report.majority.map((holder) => (
                <OpinionCard key={holder.modelId} holder={holder} variant="majority" />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold">
                Dissenting Opinion{report.minority.length !== 1 ? "s" : ""} ({report.minority.length})
              </h3>
            </div>
            <div className="space-y-3">
              {report.minority.map((holder) => (
                <OpinionCard key={holder.modelId} holder={holder} variant="minority" />
              ))}
            </div>
          </div>
        </div>

        {report.disagreements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Key Disagreements</h3>
            <div className="space-y-3">
              {report.disagreements.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{point.topic}</span>
                    <SignificanceBadge level={point.significance} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="rounded-md bg-green-50/50 dark:bg-green-950/10 p-2.5">
                      <span className="text-[10px] font-semibold uppercase text-green-600 dark:text-green-400 tracking-wider">
                        Majority
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {point.majorityPosition}
                      </p>
                    </div>
                    <div className="rounded-md bg-amber-50/50 dark:bg-amber-950/10 p-2.5">
                      <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                        Dissent
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {point.minorityPosition}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {report.consensusAreas.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Areas of Agreement</h3>
            <div className="flex flex-wrap gap-2">
              {report.consensusAreas.map((area, index) => (
                <span
                  key={index}
                  className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
