"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const agents = [
  { name: "GPT-4o", chip: "Agrees", chipKind: "agree" as const, pct: 87 },
  { name: "Claude 4.5", chip: "Agrees", chipKind: "agree" as const, pct: 82 },
  {
    name: "Gemini 2.0",
    chip: "Dissents",
    chipKind: "dissent" as const,
    pct: 64,
  },
];

export function HomeHero() {
  const barsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bars =
      barsRef.current?.querySelectorAll<HTMLDivElement>("[data-pct]");
    if (!bars) return;
    const t = setTimeout(() => {
      bars.forEach((b) => {
        b.style.width = (b.dataset.pct ?? "0") + "%";
      });
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="pt-40 pb-24">
      <div className="container-narrow">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-16 items-center">
          <div>
            <div
              className="badge-pulse mb-7 opacity-0 animate-[fadeUp_0.8s_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
              style={{ animationDelay: "0.15s" }}
            >
              <span className="dot" />
              Open source · MIT · v0.4.2
            </div>

            <h1 className="display text-[clamp(44px,7vw,88px)]">
              <span className="reveal-word" style={{ animationDelay: "0.1s" }}>
                Answers
              </span>{" "}
              <span className="reveal-word" style={{ animationDelay: "0.2s" }}>
                that
              </span>
              <br />
              <span className="reveal-word" style={{ animationDelay: "0.3s" }}>
                survive
              </span>{" "}
              <span className="reveal-word" style={{ animationDelay: "0.4s" }}>
                <em>cross-examination.</em>
              </span>
            </h1>

            <p
              className="text-[19px] leading-[1.55] text-ink-secondary max-w-[560px] mt-7 mb-9 opacity-0 animate-[fadeUp_0.8s_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
              style={{ animationDelay: "0.9s" }}
            >
              Consilium makes GPT, Claude, and Gemini propose, challenge, and
              rebut each other in structured rounds. Every verdict ships with a
              calibrated confidence score, a minority dissent report, and a
              complete audit trail. Bring your own keys.
            </p>

            <div
              className="flex gap-3 flex-wrap opacity-0 animate-[fadeUp_0.8s_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
              style={{ animationDelay: "1.1s" }}
            >
              <Link
                href="/council"
                className="btn-consilium btn-consilium-primary btn-consilium-lg"
              >
                Try the Council ↗
              </Link>
              <Link
                href="https://github.com/skadri1601/Consilium"
                target="_blank"
                rel="noreferrer"
                className="btn-consilium btn-consilium-lg"
              >
                Star on GitHub
              </Link>
            </div>
          </div>

          <div
            className="demo-card-frame opacity-0 translate-y-10 scale-[0.98]"
            style={{
              animation:
                "demoReveal 1s cubic-bezier(0.2,0.8,0.2,1) 0.7s forwards",
            }}
            ref={barsRef}
          >
            <div className="flex justify-between items-baseline pb-3.5 mb-3.5 border-b border-white/[0.08]">
              <div>
                <div className="font-mono text-[10px] text-ink-tertiary uppercase tracking-[0.1em]">
                  Sample verdict
                </div>
                <div className="font-display italic text-[15px] text-ink-primary mt-1">
                  "Monolith or microservices at 50k DAU? "
                </div>
              </div>
              <div className="font-mono text-[10px] text-ink-tertiary">
                COUNCIL · 47s
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-3.5">
              {agents.map((a, i) => (
                <div
                  key={a.name}
                  className="grid items-center gap-3 px-3 py-2.5 bg-bg-2 rounded-lg text-[12px] opacity-0"
                  style={{
                    gridTemplateColumns: "86px 60px 1fr 36px",
                    animation: `slideInRow 0.5s cubic-bezier(0.2,0.8,0.2,1) ${1.3 + i * 0.2}s forwards`,
                  }}
                >
                  <span className="text-ink-primary font-medium">{a.name}</span>
                  <span
                    className={`text-[10px] px-[7px] py-[2px] rounded font-medium text-center font-mono tracking-[0.04em] uppercase ${a.chipKind === "agree" ? "bg-agree/14 text-agree" : "bg-dissent/14 text-dissent"}`}
                  >
                    {a.chip}
                  </span>
                  <div className="h-[3px] bg-surface rounded-sm overflow-hidden">
                    <div
                      data-pct={String(a.pct)}
                      className={`h-full w-0 transition-[width] duration-[1.2s] ease-out ${a.chipKind === "agree" ? "bg-agree" : "bg-dissent"}`}
                    />
                  </div>
                  <span className="text-right font-mono text-ink-secondary text-[11px]">
                    {(a.pct / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="px-4 py-3.5 bg-bg-2 rounded-[10px] opacity-0"
              style={{
                animation:
                  "fadeUp 0.6s cubic-bezier(0.2,0.8,0.2,1) 2.1s forwards",
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="font-display text-[13px] text-ink-primary tracking-[-0.01em]">
                  Verdict
                </div>
                <div className="font-mono text-[10px] py-[3px] px-2 rounded-full bg-agree/14 text-agree tracking-[0.04em]">
                  0.78 confidence
                </div>
              </div>
              <p className="text-[13px] text-ink-primary leading-[1.55] mb-2.5">
                Refactor into a modular monolith with explicit bounded contexts.
                Revisit the split once a context sustains load the monolith
                can't absorb.
              </p>
              <div className="text-[11px] text-dissent leading-[1.5] pt-2.5 border-t border-white/[0.08]">
                <strong className="font-medium">Dissent · Gemini 2.0:</strong>{" "}
                Team has K8s experience now. Splitting later will cost more than
                splitting today.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-8 border-y border-white/[0.08] py-10">
          {[
            { num: "8", lab: "Deliberation modes" },
            { num: "5", lab: "LLM providers" },
            { num: "350", lab: "Benchmark runs" },
            { num: "100%", lab: "Open source · BYOK" },
          ].map((stat) => (
            <div key={stat.lab}>
              <div className="font-display text-[42px] font-light text-warm leading-none mb-1.5 tracking-[-0.02em]">
                {stat.num}
              </div>
              <div className="font-mono text-[11px] text-ink-tertiary tracking-[0.08em] uppercase">
                {stat.lab}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes demoReveal {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
