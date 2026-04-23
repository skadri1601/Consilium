"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { cn } from "@/shared/lib/utils";
import { AGENTS } from "@/shared/lib/constants";
import { ChevronDown, Scale, Users, AlertTriangle } from "lucide-react";

const AGENT_NAME_MAP = new Map<string, string>(
  AGENTS.map((a) => [a.id, a.name]),
);

function getModelDisplayName(modelId: string): string {
  return AGENT_NAME_MAP.get(modelId) ?? modelId;
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
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] bg-bg-2 border border-white/[0.08] text-ink-secondary">
      {getModelDisplayName(modelId)}
    </span>
  );
}

function AgreementIndicator({
  agreeCount,
  totalModels,
}: {
  agreeCount: number;
  totalModels: number;
}) {
  const percentage =
    totalModels > 0 ? Math.round((agreeCount / totalModels) * 100) : 0;
  const isUnanimous = agreeCount === totalModels;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-ink-tertiary" />
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-secondary">
          {agreeCount} of {totalModels} agree
        </span>
      </div>
      <div className="flex-1 max-w-[200px] h-1 rounded-full bg-bg-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isUnanimous
              ? "bg-agree"
              : percentage >= 75
                ? "bg-warm"
                : "bg-dissent",
          )}
        />
      </div>
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          isUnanimous ? "text-agree" : "text-ink-tertiary",
        )}
      >
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
          <Scale className="h-4 w-4 text-warm" />
          <h3 className="font-display text-[18px] tracking-[-0.01em] text-ink-primary">
            Majority opinion
          </h3>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {cluster.models.map((m) => (
            <ModelBadge key={m} modelId={m} />
          ))}
        </div>
      </div>

      <div className="pl-4 border-l border-warm/40">
        <p className="text-[14px] leading-[1.7] text-ink-secondary">
          {cluster.positionSummary}
        </p>

        {cluster.keyArguments.length > 0 && (
          <div className="mt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">
              Key arguments
            </p>
            <ul className="space-y-1.5">
              {cluster.keyArguments.map((arg, i) => (
                <li
                  key={i}
                  className="text-[13px] text-ink-secondary flex gap-2"
                >
                  <span className="font-mono text-ink-tertiary shrink-0">
                    {i + 1}.
                  </span>
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
            <AccordionTrigger className="py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary hover:no-underline hover:text-ink-primary">
              Full reasoning chain
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2 pl-4 border-l border-white/[0.08]">
                {cluster.reasoningChain.map((step, i) => (
                  <li key={i} className="text-[12px] text-ink-tertiary pl-3">
                    <span className="font-mono uppercase tracking-[0.06em] text-ink-muted">
                      Step {i + 1}:
                    </span>{" "}
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

function DissentSection({
  cluster,
  index,
}: {
  cluster: DissentCluster;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
      className="ml-4 md:ml-8 pl-4 border-l border-dissent/40"
    >
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-dissent" />
          <h4 className="font-display text-[16px] tracking-[-0.01em] text-ink-primary italic">
            Dissent {index + 1}
          </h4>
          {cluster.confidence != null && (
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary tabular-nums">
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

      <p className="text-[14px] leading-[1.7] text-ink-secondary italic">
        {cluster.positionSummary}
      </p>

      {cluster.keyArguments.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1.5">
            Points of disagreement
          </p>
          <ul className="space-y-1">
            {cluster.keyArguments.map((arg, i) => (
              <li key={i} className="text-[13px] text-ink-secondary flex gap-2">
                <span className="text-dissent shrink-0">•</span>
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
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary hover:text-ink-primary transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
            Full reasoning chain
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
                <ol className="mt-2 space-y-1.5 pl-4 border-l border-white/[0.08]">
                  {cluster.reasoningChain.map((step, i) => (
                    <li key={i} className="text-[12px] text-ink-tertiary pl-3">
                      <span className="font-mono uppercase tracking-[0.06em] text-ink-muted">
                        Step {i + 1}:
                      </span>{" "}
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

export function DissentReport({
  report,
  totalModels,
  className,
}: DissentReportProps) {
  const majorityCount = report.majority?.models.length ?? 0;
  const isConsensus = report.type === "consensus";

  return (
    <div className={cn("surface-card overflow-hidden p-5", className)}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="eyebrow">Council opinion</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] text-ink-primary mt-1 flex items-center gap-2">
            <Scale className="h-4 w-4 text-warm" />
            {isConsensus ? "Unanimous opinion" : "Opinion of the council"}
          </h2>
        </div>
        <AgreementIndicator
          agreeCount={majorityCount}
          totalModels={totalModels}
        />
      </div>

      <div className="space-y-6">
        {report.majority && <MajoritySection cluster={report.majority} />}

        {!isConsensus && report.minority.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                Dissenting opinions
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
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
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                Specific disagreements
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <Accordion type="multiple" className="space-y-0">
              {report.disagreementPoints.map((dp, i) => (
                <AccordionItem
                  key={i}
                  value={`dp-${i}`}
                  className="border-white/[0.06]"
                >
                  <AccordionTrigger className="py-3 text-[13px] hover:no-underline">
                    <div className="flex items-center gap-2 text-left flex-wrap">
                      <ModelBadge modelId={dp.challenger} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                        challenges
                      </span>
                      <ModelBadge modelId={dp.target} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary ml-1">
                        ({dp.type})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-[13px] text-ink-secondary pl-4 border-l border-white/[0.08] leading-[1.6]">
                      {dp.argument}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        )}
      </div>
    </div>
  );
}
