import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";

export default function ComparePage() {
  return (
    <>
      <PageHeader
        eyebrow="Compare"
        title={
          <>
            Side-by-side <em className="not-italic text-warm">verdicts.</em>
          </>
        }
        description="Run the same topic through two modes — Council vs Red Team, Blind vs Standard — and diff the outputs, confidence, and dissent."
      />
      <div className="px-6 lg:px-8 py-16">
        <div className="max-w-[720px] mx-auto text-center">
          <div className="surface-card p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary mb-3">
              Coming soon
            </div>
            <h2 className="font-display font-light text-[28px] tracking-[-0.02em] text-ink-primary mb-3">
              Comparison mode is on the roadmap.
            </h2>
            <p className="text-[14px] text-ink-secondary leading-[1.55] mb-6">
              Meanwhile, run two deliberations with different modes and open
              both from History — their verdict panels can be compared
              side-by-side.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/council" className="btn-consilium btn-consilium-primary">
                Start a deliberation
              </Link>
              <Link href="/history" className="btn-consilium">
                Open history
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
