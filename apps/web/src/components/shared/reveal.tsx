"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3;
  as?: "div" | "section" | "article" | "header";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const delayClass =
    delay === 1
      ? "delay-1"
      : delay === 2
        ? "delay-2"
        : delay === 3
          ? "delay-3"
          : undefined;

  return (
    <As ref={ref as never} className={cn("reveal", delayClass, className)}>
      {children}
    </As>
  );
}
