import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/shared/brand-mark";
import { GrainOverlay } from "@/components/shared/grain-overlay";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist or has moved.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
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
          <div className="eyebrow mb-5">404 · Not found</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02]">
            This verdict
            <br />
            <em>was never issued.</em>
          </h1>
          <p className="mt-6 max-w-[520px] text-[16px] leading-[1.55] text-ink-secondary">
            The page you're looking for doesn't exist, has moved, or never
            passed the Council.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/" className="btn-consilium btn-consilium-primary">
              Back to home
            </Link>
            <Link href="/council" className="btn-consilium">
              Go to Council ↗
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
