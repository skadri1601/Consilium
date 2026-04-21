import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-6 lg:px-8 pt-9 pb-7 border-b border-white/[0.08]",
        className,
      )}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
          <h1 className="font-display font-light text-[clamp(26px,3vw,36px)] tracking-[-0.02em] leading-[1.15] text-ink-primary">
            {title}
          </h1>
          {description && (
            <p className="text-[14px] text-ink-secondary mt-2 max-w-[640px] leading-[1.55]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
