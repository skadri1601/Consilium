"use client";

import Link from "next/link";
import { CouncilChat } from "@/features/council/components/council-chat";

export default function CouncilPage() {
  return (
    <>
      <div className="px-6 lg:px-8 py-4 border-b border-white/[0.08] flex items-center gap-4 bg-bg-0">
        <div className="font-mono text-[11px] text-ink-tertiary uppercase tracking-[0.06em]">
          Council / <span className="text-warm">New deliberation</span>
        </div>
        <div className="flex-1" />
        <Link href="/history" className="btn-consilium">
          History
        </Link>
        <Link href="/council" className="btn-consilium btn-consilium-primary">
          New deliberation
        </Link>
      </div>

      <div className="px-6 lg:px-8 pt-9 pb-6 border-b border-white/[0.08]">
        <div className="eyebrow mb-3">Topic under deliberation</div>
        <h1 className="font-display font-light text-[clamp(22px,3.2vw,32px)] leading-[1.2] tracking-[-0.02em] text-ink-primary max-w-[900px] mb-4">
          Pose a question and let the Council debate.
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-warm/12 text-warm border border-warm/30 rounded-full font-mono text-[11px] tracking-[0.04em]">
            Council mode
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-bg-2 border border-white/[0.08] rounded-full font-mono text-[11px] text-ink-secondary tracking-[0.04em]">
            Multi-round deliberation
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-bg-2 border border-white/[0.08] rounded-full font-mono text-[11px] text-ink-secondary tracking-[0.04em]">
            <span className="block h-1.5 w-1.5 rounded-full bg-warm animate-warm-pulse" />
            Awaiting topic
          </span>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-8 py-8">
        <CouncilChat />
      </div>
    </>
  );
}
