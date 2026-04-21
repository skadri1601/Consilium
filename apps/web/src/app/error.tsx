"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { GrainOverlay } from "@/components/shared/grain-overlay";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="relative min-h-screen bg-bg-0 text-ink-primary flex flex-col">
      <GrainOverlay />
      <header className="relative z-10 px-6 lg:px-8 py-5 flex items-center justify-between border-b border-white/[0.08]">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display font-medium text-[18px] tracking-[-0.01em] text-ink-primary"
        >
          <BrandMark />
          Consilium
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-[640px]">
          <div className="eyebrow mb-5">System · 500</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02]">
            Something didn't
            <br />
            <em>hold up.</em>
          </h1>
          <p className="mt-6 max-w-[520px] text-[16px] leading-[1.55] text-ink-secondary">
            An unexpected error interrupted the deliberation. The incident has
            been reported. Try the action again, or return home.
          </p>

          {error.message && (
            <div className="mt-8 surface-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">
                Error detail
              </div>
              <p className="font-mono text-[12px] text-ink-secondary break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 font-mono text-[10px] text-ink-muted">
                  digest {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="btn-consilium btn-consilium-primary"
            >
              Try again
            </button>
            <Link href="/" className="btn-consilium">
              Go home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
