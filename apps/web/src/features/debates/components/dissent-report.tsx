"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { cn } from "@/shared/lib/utils";
import { AGENTS } from "@/shared/lib/constants";
import { ChevronDown, Scale, Users, AlertTriangle } from "lucide-react";

const AGENT_NAME_MAP = new Map<string, string>(AGENTS.map((a) => [a.id, a.name]));

function getModelDisplayName(modelId: string): string {
  return AGENT_NAME_MAP.get(modelId) ?? modelId;
}

const MODEL_COLORS: Record<string, string> = {
  OpenAI: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Anthropic: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Google: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Groq: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  XAI: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

function getModelBadgeColor(modelId: string): string {
  const agent = AGENTS.find((a) => a.id === modelId);
  if (!agent) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  return MODEL_COLORS[agent.provider] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

interface DissentCluster {
  models: string[];
  positionSummary: string;
  keyArguments: string[];
  reasoningChain?: string[];
  confidence?: number;
}

interface DisagreementPoint {
  challenger: string;
  target: string;
  type: string;
  argument: string;
}

interface DissentReportData {
  type: "consensus" | "dissent";
  majority: DissentCluster | null;
  minority: DissentCluster[];
  disagreementPoints?: DisagreementPoint[];
}

interface DissentReportProps {
  report: DissentReportData;
  totalModels: number;
  className?: string;
}

function ModelBadge({ modelId }: { modelId: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getModelBadgeColor(modelId)
      )}
    >
      {getModelDisplayName(modelId)}
    </span>
  );
}

function AgreementIndicator({ agreeCount, totalModels }: { agreeCount: number; totalModels: number }) {
  const percentage = totalModels > 0 ? Math.round((agreeCount / totalModels) * 100) : 0;
  const isUnanimous = agreeCount === totalModels;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {agreeCount} of {totalModels} models agree
        </span>
      </div>
      <div className="flex-1 max-w-[200px] h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isUnanimous ? "bg-emerald-500" : percentage >= 75 ? "bg-amber-500" : "bg-rose-500"
          )}
        />
      </div>
      <span className={cn(
        "text-sm font-semibold tabular-nums",
        isUnanimous ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
      )}>
        {percentage}%
      </span>
    </div>
  );
}

function MajoritySection({ cluster }: { cluster: DissentCluster }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold font-serif tracking-tight">
            Majority Opinion
          </h3>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {cluster.models.map((m) => (
            <ModelBadge key={m} modelId={m} />
          ))}
        </div>
      </div>

      <div className="pl-4 border-l-2 border-primary/30">
        <p className="text-sm leading-relaxed font-serif text-foreground/90">
          {cluster.positionSummary}
        </p>

        {cluster.keyArguments.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Key Arguments
            </p>
            <ul className="space-y-1.5">
              {cluster.keyArguments.map((arg, i) => (
                <li key={i} className="text-sm text-foreground/80 flex gap-2">
                  <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                  <span>{arg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {cluster.reasoningChain && cluster.reasoningChain.length > 0 && (
        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="majority-reasoning" className="border-none">
            <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
              Full Reasoning Chain
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2 pl-4 border-l border-muted">
                {cluster.reasoningChain.map((step, i) => (
                  <li key={i} className="text-xs text-foreground/70 pl-3">
                    <span className="font-medium text-muted-foreground">Step {i + 1}:</span>{" "}
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </motion.div>
  );
}

function DissentSection({ cluster, index }: { cluster: DissentCluster; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
      className="ml-4 md:ml-8 pl-4 border-l-2 border-rose-300/50 dark:border-rose-700/50"
    >
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <h4 className="text-base font-semibold font-serif tracking-tight text-foreground/80">
            Dissent {index + 1}
          </h4>
          {cluster.confidence != null && (
            <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
              Confidence: {Math.round(cluster.confidence * 100)}%
            </span>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {cluster.models.map((m) => (
            <ModelBadge key={m} modelId={m} />
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed font-serif text-foreground/75 italic">
        {cluster.positionSummary}
      </p>

      {cluster.keyArguments.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Points of Disagreement
          </p>
          <ul className="space-y-1">
            {cluster.keyArguments.map((arg, i) => (
              <li key={i} className="text-sm text-foreground/70 flex gap-2">
                <span className="text-rose-400 shrink-0">&bull;</span>
                <span>{arg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cluster.reasoningChain && cluster.reasoningChain.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
            Full Reasoning Chain
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ol className="mt-2 space-y-1.5 pl-4 border-l border-muted">
                  {cluster.reasoningChain.map((step, i) => (
                    <li key={i} className="text-xs text-foreground/60 pl-3">
                      <span className="font-medium text-muted-foreground">Step {i + 1}:</span>{" "}
                      {step}
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export function DissentReport({ report, totalModels, className }: DissentReportProps) {
  const majorityCount = report.majority?.models.length ?? 0;
  const isConsensus = report.type === "consensus";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-xl font-serif tracking-tight flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {isConsensus ? "Unanimous Opinion" : "Opinion of the Council"}
          </CardTitle>
          <AgreementIndicator agreeCount={majorityCount} totalModels={totalModels} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {report.majority && <MajoritySection cluster={report.majority} />}

        {!isConsensus && report.minority.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Dissenting Opinions
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-6">
              {report.minority.map((cluster, i) => (
                <DissentSection key={i} cluster={cluster} index={i} />
              ))}
            </div>
          </>
        )}

        {report.disagreementPoints && report.disagreementPoints.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Specific Disagreements
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Accordion type="multiple" className="space-y-0">
              {report.disagreementPoints.map((dp, i) => (
                <AccordionItem key={i} value={`dp-${i}`}>
                  <AccordionTrigger className="py-3 text-sm">
                    <div className="flex items-center gap-2 text-left">
                      <ModelBadge modelId={dp.challenger} />
                      <span className="text-muted-foreground">challenges</span>
                      <ModelBadge modelId={dp.target} />
                      <span className="text-xs text-muted-foreground ml-1">({dp.type})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-foreground/80 pl-4 border-l-2 border-muted font-serif">
                      {dp.argument}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
}
