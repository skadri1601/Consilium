import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

// Shared marketing-page hero block. Extracted from the ~22 near-identical
// copies sprinkled across marketing/docs pages so SonarQube duplication
// stays under the 3% threshold and a single edit propagates everywhere.
export function MarketingHero({
  eyebrow,
  title,
  description,
  actions,
  meta,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("pt-28 pb-16 border-b border-white/[0.08]", className)}
    >
      <div className="container-narrow">
        {eyebrow &&
          (typeof eyebrow === "string" ? (
            <div className="eyebrow mb-5">{eyebrow}</div>
          ) : (
            <div className="mb-5">{eyebrow}</div>
          ))}
        <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
          {title}
        </h1>
        {description && (
          <p className="mt-6 max-w-[640px] text-[17px] leading-[1.55] text-ink-secondary">
            {description}
          </p>
        )}
        {meta && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">
            {meta}
          </p>
        )}
        {actions && <div className="mt-9 flex flex-wrap gap-3">{actions}</div>}
        {children}
      </div>
    </section>
  );
}
