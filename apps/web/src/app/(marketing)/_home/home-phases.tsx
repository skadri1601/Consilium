"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";

type Tone = "agree" | "dissent" | "neutral";

type Phase = {
  num: string;
  label: string;
  description: string;
  example: React.ReactNode;
};

function PE({
  meta,
  body,
  tone = "neutral",
}: {
  meta: string;
  body: string;
  tone?: Tone;
}) {
  return (
    <div className="px-4 py-3.5 bg-bg-1 border border-white/[0.08] rounded-[10px] text-[13px] leading-[1.5]">
      <div className="font-mono text-[10px] text-ink-tertiary uppercase tracking-[0.08em] mb-1.5 flex items-center gap-2">
        <span
          className={cn(
            tone === "agree" && "text-agree",
            tone === "dissent" && "text-dissent",
          )}
          dangerouslySetInnerHTML={{ __html: meta }}
        />
      </div>
      <div className="text-ink-primary">{body}</div>
    </div>
  );
}

function RubricRow({
  label,
  pct,
  weight,
}: {
  label: string;
  pct: number;
  weight: number;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr_70px] items-center gap-3 py-[9px] border-b border-white/[0.08] last:border-b-0">
      <div className="text-[13px] text-ink-secondary">{label}</div>
      <div className="h-[3px] bg-surface rounded-sm overflow-hidden">
        <div
          className="h-full bg-warm rounded-sm"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="font-mono text-[11px] text-ink-primary text-right">
        {(pct / 100).toFixed(2)}{" "}
        <span className="text-ink-tertiary">· {weight}%</span>
      </div>
    </div>
  );
}

function VoteRow({
  kind,
  title,
  meta,
  note,
}: {
  kind: "majority" | "minority";
  title: string;
  meta: string;
  note: string;
}) {
  const isMaj = kind === "majority";
  return (
    <div
      className={cn(
        "px-3.5 py-3 rounded-[10px] mb-2",
        isMaj && "bg-agree/14 border border-agree/30",
        !isMaj && "bg-dissent/14 border border-dissent/30",
      )}
    >
      <div
        className={cn(
          "flex justify-between items-center mb-1 font-display text-[14px] tracking-[-0.01em]",
          isMaj && "text-agree",
          !isMaj && "text-dissent",
        )}
      >
        <span>{title}</span>
        <span
          className={cn(
            "font-mono text-[11px]",
            isMaj && "text-agree",
            !isMaj && "text-dissent",
          )}
        >
          {meta}
        </span>
      </div>
      <div className="text-[11px] opacity-75">{note}</div>
    </div>
  );
}

const phases: Phase[] = [
  {
    num: "01",
    label: "Propose",
    description:
      "Each model analyzes the question in isolation and commits to a position with reasoning. No model sees another's answer yet.",
    example: (
      <div className="flex flex-col gap-2">
        <PE
          tone="agree"
          meta='GPT-4o · <span class="text-agree">Modular monolith</span>'
          body="At 50k DAU, operational risk of K8s exceeds scaling benefit. Keep it boring."
        />
        <PE
          tone="agree"
          meta='Claude 4.5 · <span class="text-agree">Modular monolith</span>'
          body="Extract notifications and billing as first split candidates. Not yet."
        />
        <PE
          tone="dissent"
          meta='Gemini 2.0 · <span class="text-dissent">Microservices now</span>'
          body="Team already knows K8s. A second migration later will cost more than starting distributed today."
        />
      </div>
    ),
  },
  {
    num: "02",
    label: "Challenge",
    description:
      "Models read each other's positions and file specific challenges against the reasoning, not the conclusion.",
    example: (
      <div className="flex flex-col gap-2">
        <PE
          meta="Gemini → GPT-4o"
          body="The 50k DAU threshold is arbitrary. Where's the load-pattern evidence? "
        />
        <PE
          meta="Claude → Gemini"
          body='"Migration cost later" ignores the blast radius of a bad split now.'
        />
        <PE
          meta="GPT-4o → Gemini"
          body={`"Team has K8s experience" doesn't equal"team can run K8s in prod under a 99.9% SLA."`}
        />
      </div>
    ),
  },
  {
    num: "03",
    label: "Rebut",
    description:
      "Each model responds to challenges: concede, refute, qualify, or redirect. Positions get revised in view of the exchange.",
    example: (
      <div className="flex flex-col gap-2">
        <PE
          tone="agree"
          meta='GPT-4o · <span class="text-agree">qualifies</span>'
          body="Fair. The threshold is a heuristic. At this traffic, coordination cost of microservices dominates any scaling gain."
        />
        <PE
          tone="dissent"
          meta='Gemini · <span class="text-dissent">concedes partially</span>'
          body="Granted on the SLA risk. Still argue the migrate-later cost is underweighted."
        />
        <PE
          tone="agree"
          meta='Claude · <span class="text-agree">refutes</span>'
          body="Bounded contexts inside a monolith are reversible. Premature microservices are not."
        />
      </div>
    ),
  },
  {
    num: "04",
    label: "Evaluate",
    description:
      "A judge model scores each surviving position on a weighted rubric. No model scores itself.",
    example: (
      <div>
        <RubricRow label="Correctness" pct={86} weight={30} />
        <RubricRow label="Reasoning quality" pct={81} weight={25} />
        <RubricRow label="Completeness" pct={74} weight={20} />
        <RubricRow label="Actionability" pct={83} weight={15} />
        <RubricRow label="Conciseness" pct={70} weight={10} />
      </div>
    ),
  },
  {
    num: "05",
    label: "Vote",
    description:
      "Models cast ranked ballots weighted by their own confidence. Dissent is preserved, not averaged away.",
    example: (
      <div>
        <VoteRow
          kind="majority"
          title="Modular monolith"
          meta="2 votes · weight 1.69"
          note="GPT-4o (0.87) + Claude (0.82)"
        />
        <VoteRow
          kind="minority"
          title="Microservices now"
          meta="1 vote · weight 0.64"
          note="Gemini 2.0 (0.64) — dissent preserved in report"
        />
      </div>
    ),
  },
  {
    num: "06",
    label: "Synthesize",
    description:
      "The judge integrates majority reasoning and minority dissent into a single verdict with a calibrated confidence score.",
    example: (
      <div className="px-[18px] py-4 bg-bg-1 border border-white/[0.08] rounded-[10px]">
        <div className="flex justify-between items-center mb-3">
          <div className="font-display text-[15px] text-ink-primary tracking-[-0.01em]">
            Verdict
          </div>
          <div className="font-mono text-[10px] py-[3px] px-2 rounded-full bg-agree/14 text-agree tracking-[0.04em]">
            0.78 confidence
          </div>
        </div>
        <p className="text-[14px] text-ink-primary leading-[1.55] mb-3.5">
          Refactor into a modular monolith with explicit bounded contexts.
          Revisit the split once a single context sustains load the monolith
          can't absorb.
        </p>
        <div className="text-[12px] text-dissent leading-[1.5]">
          <strong className="font-medium">Dissent · Gemini 2.0:</strong> Team
          has K8s experience now. Splitting later will cost more than splitting
          today.
        </div>
      </div>
    ),
  },
];

export function HomePhases() {
  const [active, setActive] = useState(0);
  const phase = phases[active];

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8 border-b border-white/[0.08] pb-6">
        {phases.map((p, idx) => {
          const isActive = idx === active;
          return (
            <button
              key={p.num}
              type="button"
              onClick={() => setActive(idx)}
              className={cn(
                "relative bg-transparent text-left py-4 px-2 transition-all duration-300 border-t",
                isActive ? "border-warm" : "border-white/[0.08]",
              )}
            >
              {isActive && (
                <span className="absolute -top-px left-0 h-px w-full bg-warm" />
              )}
              <span
                className={cn(
                  "block font-mono text-[10px] tracking-[0.1em] mb-1.5",
                  isActive ? "text-warm" : "text-ink-muted",
                )}
              >
                {p.num}
              </span>
              <span
                className={cn(
                  "block font-display text-[17px] tracking-[-0.01em]",
                  isActive
                    ? "text-ink-primary italic"
                    : "text-ink-tertiary hover:text-ink-secondary",
                )}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        key={active}
        className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 items-start animate-[fadeUp_0.5s_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        <div className="font-display italic font-light text-[18px] leading-[1.55] text-ink-secondary first-letter:text-[44px] first-letter:text-warm first-letter:float-left first-letter:leading-[0.9] first-letter:mr-1.5 first-letter:mt-1">
          {phase.description}
        </div>
        {phase.example}
      </div>
    </>
  );
}
