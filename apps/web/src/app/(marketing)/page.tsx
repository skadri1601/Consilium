import Link from "next/link";
import { HomePhases } from "./_home/home-phases";
import { HomeHero } from "./_home/home-hero";
import { Reveal } from "@/components/shared/reveal";

const modeGroups = [
  {
    label: "Speed vs depth",
    pair: [
      {
        name: "Quick",
        time: "~15s",
        desc: "Single round. When you need a fast sanity check, not a debate.",
      },
      {
        name: "Deep",
        time: "~90s",
        desc: "Five rounds with sub-agent research. High-stakes or ambiguous questions.",
      },
    ],
  },
  {
    label: "Evaluation & safety",
    pair: [
      {
        name: "Blind",
        time: "~45s",
        desc: "Model names hidden until scoring. Removes brand anchoring from the verdict.",
      },
      {
        name: "Red Team",
        time: "~120s",
        desc: "Models actively attack each other's arguments. Security and robustness review.",
      },
    ],
  },
  {
    label: "Consensus mechanism",
    pair: [
      {
        name: "Jury",
        time: "~60s",
        desc: "Panel voting with ranked choice. Reach consensus or declare dissent.",
      },
      {
        name: "Market",
        time: "~90s",
        desc: "Prediction market aggregation. Models stake confidence on positions.",
      },
    ],
  },
];

const compareRows = [
  {
    feature: "Adversarial cross-examination",
    consilium: true,
    crewai: false,
    langgraph: false,
    autogen: false,
  },
  {
    feature: "Dissent reports in output",
    consilium: true,
    crewai: false,
    langgraph: false,
    autogen: false,
  },
  {
    feature: "Confidence-weighted voting",
    consilium: true,
    crewai: false,
    langgraph: false,
    autogen: false,
  },
  {
    feature: "Blind evaluation mode",
    consilium: true,
    crewai: false,
    langgraph: false,
    autogen: false,
  },
  {
    feature: "Red team mode",
    consilium: true,
    crewai: false,
    langgraph: false,
    autogen: false,
  },
  {
    feature: "Prediction market aggregation",
    consilium: true,
    crewai: false,
    langgraph: false,
    autogen: false,
  },
  {
    feature: "Full audit trail of reasoning",
    consilium: true,
    crewai: false,
    langgraph: true,
    autogen: false,
  },
];

const papers = [
  {
    cite: "Khan et al. — ICML 2024",
    title: "Debating with More Persuasive LLMs Leads to More Truthful Answers",
    body: "AI debate produces more truthful answers than single-model prompting, even when one debater argues for the wrong answer.",
    powers: "Powers Blind mode",
  },
  {
    cite: "Du et al. — ICML 2024",
    title: "Improving Factuality and Reasoning via Multiagent Debate",
    body: "Multi-agent debate significantly improves factual accuracy and mathematical reasoning across multiple benchmarks.",
    powers: "Powers Challenge & Rebut phases",
  },
  {
    cite: "Chen et al. — ACL 2024",
    title: "ReConcile: Round-Table Reasoning via Consensus",
    body: "Structured multi-round discussion with confidence-weighted voting outperforms single-model and simple ensemble approaches.",
    powers: "Powers Vote & confidence calibration",
  },
  {
    cite: "Irving et al. — OpenAI / Anthropic",
    title: "AI Safety via Debate",
    body: "Debate between AI systems provides a scalable mechanism where adversarial interaction surfaces deceptive or incorrect reasoning.",
    powers: "Powers Red Team mode",
  },
];

export default function LandingPage() {
  return (
    <>
      <HomeHero />

      {/* HOW IT WORKS */}
      <section id="how" className="py-32">
        <div className="container-narrow">
          <Reveal>
            <div className="eyebrow mb-5">How it works</div>
            <h2 className="section-heading mb-4 text-[clamp(32px,4.5vw,52px)] max-w-[720px]">
              Six phases.
              <br />
              One <em>running example.</em>
            </h2>
            <p className="text-[16px] leading-[1.6] text-ink-secondary max-w-[560px] mb-14">
              Every Council deliberation moves through these phases. Click
              through to see what each looks like with a real question:
              "Monolith or microservices at 50k DAU? "
            </p>
          </Reveal>

          <Reveal delay={1}>
            <HomePhases />
          </Reveal>
        </div>
      </section>

      {/* MODES */}
      <section
        id="modes"
        className="py-32 bg-bg-1 border-y border-white/[0.08]"
      >
        <div className="container-narrow">
          <Reveal>
            <div className="eyebrow mb-5">Deliberation modes</div>
            <h2 className="section-heading mb-4 text-[clamp(32px,4.5vw,52px)] max-w-[720px]">
              Start with Council.
              <br />
              Reach for <em>the rest</em> when you need them.
            </h2>
            <p className="text-[16px] leading-[1.6] text-ink-secondary max-w-[560px] mb-14">
              Eight modes, one default. The others exist for specific jobs:
              speed, anonymity, adversarial probing, or consensus mechanics.
            </p>
          </Reveal>

          <Reveal delay={1} className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-2xl border border-warm/30 bg-gradient-to-br from-warm/12 to-transparent p-9">
              <div className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-warm/12 blur-3xl" />
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-warm flex items-center gap-[10px] mb-3.5">
                <span className="block h-px w-6 bg-warm" />
                Default mode
              </div>
              <h3 className="font-display font-light text-[40px] leading-[1.05] tracking-[-0.02em] text-ink-primary mb-3">
                Council.
              </h3>
              <p className="text-[16px] leading-[1.55] text-ink-secondary max-w-[560px] mb-5">
                Multi-round deliberation between models with cross-examination
                and rebuttal. Use this unless the task clearly calls for one of
                the specialized modes below.
              </p>
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mb-6">
                3 rounds · ~45s ·{" "}
                <span className="text-warm">$0.05–0.10 per run</span>
              </div>
              <Link
                href="/council"
                className="btn-consilium btn-consilium-primary"
              >
                Try Council ↗
              </Link>
            </div>

            {modeGroups.map((group) => (
              <div key={group.label}>
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-tertiary my-6 flex items-center gap-3">
                  {group.label}
                  <span className="block h-px flex-1 bg-white/[0.08]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.pair.map((mode) => (
                    <div
                      key={mode.name}
                      className="surface-card hoverable px-[22px] py-5 cursor-pointer"
                    >
                      <div className="flex justify-between items-baseline mb-1.5">
                        <h4 className="font-display text-[22px] font-normal tracking-[-0.01em] text-ink-primary">
                          {mode.name}
                        </h4>
                        <span className="font-mono text-[10px] text-ink-tertiary">
                          {mode.time}
                        </span>
                      </div>
                      <p className="text-[13px] text-ink-secondary leading-[1.5]">
                        {mode.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-2 surface-card bg-bg-2 px-6 py-5 flex justify-between items-center gap-5">
              <div>
                <h4 className="font-display text-[22px] font-normal tracking-[-0.01em] text-ink-primary">
                  Auto
                </h4>
                <p className="text-[13px] text-ink-secondary mt-1">
                  Can't decide? Consilium picks the right mode based on topic
                  complexity and risk.
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-warm py-1.5 px-3 rounded-full border border-warm/30 whitespace-nowrap">
                Escape hatch
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* COMPARE */}
      <section id="compare" className="py-32">
        <div className="container-narrow">
          <Reveal>
            <div className="eyebrow mb-5">The comparison</div>
            <h2 className="section-heading mb-4 text-[clamp(32px,4.5vw,52px)] max-w-[720px]">
              If you need deliberation,
              <br />
              there's <em>one option.</em>
            </h2>
            <p className="text-[16px] leading-[1.6] text-ink-secondary max-w-[560px] mb-10">
              Multi-agent frameworks orchestrate workers. Consilium is the only
              one that makes them argue.
            </p>
          </Reveal>

          <Reveal delay={1}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm mt-2">
                <thead>
                  <tr>
                    <th className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary font-medium py-[18px] text-left pl-0 w-[40%] border-b border-white/[0.18]">
                      Capability
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.12em] text-warm font-medium py-[18px] text-center border-b border-white/[0.18]">
                      Consilium
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary font-medium py-[18px] text-center border-b border-white/[0.18]">
                      CrewAI
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary font-medium py-[18px] text-center border-b border-white/[0.18]">
                      LangGraph
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary font-medium py-[18px] text-center border-b border-white/[0.18]">
                      AutoGen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td
                        className={`text-ink-primary text-[15px] py-[18px] pl-0 ${i === compareRows.length - 1 ? "" : "border-b border-white/[0.08]"}`}
                      >
                        {row.feature}
                      </td>
                      <td
                        className={`text-center py-[18px] bg-gradient-to-b from-warm/12 to-transparent ${row.consilium ? "text-agree font-mono text-[15px] font-medium" : "text-ink-muted text-[15px]"} ${i === compareRows.length - 1 ? "" : "border-b border-white/[0.08]"}`}
                      >
                        {row.consilium ? "✓" : "—"}
                      </td>
                      <td
                        className={`text-center py-[18px] ${row.crewai ? "text-agree font-mono text-[15px] font-medium" : "text-ink-muted text-[15px]"} ${i === compareRows.length - 1 ? "" : "border-b border-white/[0.08]"}`}
                      >
                        {row.crewai ? "✓" : "—"}
                      </td>
                      <td
                        className={`text-center py-[18px] ${row.langgraph ? "text-agree font-mono text-[15px] font-medium" : "text-ink-muted text-[15px]"} ${i === compareRows.length - 1 ? "" : "border-b border-white/[0.08]"}`}
                      >
                        {row.langgraph ? "✓" : "—"}
                      </td>
                      <td
                        className={`text-center py-[18px] ${row.autogen ? "text-agree font-mono text-[15px] font-medium" : "text-ink-muted text-[15px]"} ${i === compareRows.length - 1 ? "" : "border-b border-white/[0.08]"}`}
                      >
                        {row.autogen ? "✓" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="font-mono text-[11px] text-ink-tertiary leading-[1.6] max-w-[780px] mt-5 pt-4 border-t border-white/[0.08]">
                LangGraph can express a debate as a graph but ships no
                deliberation protocol. AutoGen's GroupChat supports turn-taking
                without structured rebuttal or voting. Comparison is based on
                shipping features as of April 2026.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SDK */}
      <section id="sdk" className="py-32 bg-bg-1 border-y border-white/[0.08]">
        <div className="container-narrow">
          <Reveal>
            <div className="eyebrow mb-5">SDK</div>
            <h2 className="section-heading mb-4 text-[clamp(32px,4.5vw,52px)] max-w-[720px]">
              Structured in.
              <br />
              <em>Structured out.</em>
            </h2>
            <p className="text-[16px] leading-[1.6] text-ink-secondary max-w-[560px] mb-14">
              Every verdict comes back as a typed object. Verdict, confidence,
              per-model votes, and dissent are fields, not free text you have to
              parse.
            </p>
          </Reveal>

          <Reveal delay={1} className="grid md:grid-cols-2 gap-6">
            <div className="surface-card overflow-hidden">
              <div className="px-[18px] py-3 border-b border-white/[0.08] flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">
                <span>The call</span>
                <span>Python</span>
              </div>
              <pre className="px-[22px] py-5 font-mono text-[13px] leading-[1.75] text-ink-primary overflow-x-auto">
                <span className="text-warm">from</span> consilium{" "}
                <span className="text-warm">import</span> ConsiliumClient
                {"\n\n"}
                client = ConsiliumClient(api_key=
                <span className="text-agree">"your-key"</span>){"\n\n"}
                result = client.deliberate({"\n"} topic=
                <span className="text-agree">"Monolith or microservices</span>
                {"\n"} <span className="text-agree">at 50k DAU? "</span>,{"\n"}{" "}
                mode=
                <span className="text-agree">"council"</span>,{"\n"} models=[
                {"\n"} <span className="text-agree">"gpt-4o"</span>,{"\n"}{" "}
                <span className="text-agree">"claude-sonnet-4-5"</span>,{"\n"}{" "}
                <span className="text-agree">"gemini-2.0-flash"</span>,{"\n"} ],
                {"\n"}){"\n"}
              </pre>
            </div>
            <div className="surface-card overflow-hidden">
              <div className="px-[18px] py-3 border-b border-white/[0.08] flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">
                <span>The result</span>
                <span>REPL</span>
              </div>
              <pre className="px-[22px] py-5 font-mono text-[13px] leading-[1.75] text-ink-primary overflow-x-auto">
                <span className="text-ink-muted select-none">{">>>"}</span>
                result.verdict{"\n"}
                <span className="text-agree">
                  "Refactor into a modular monolith with{"\n"} explicit bounded
                  contexts..."
                </span>
                {"\n\n"}
                <span className="text-ink-muted select-none">{">>>"}</span>
                result.confidence{"\n"}
                <span className="text-warm">0.78</span>
                {"\n\n"}
                <span className="text-ink-muted select-none">{">>>"}</span>
                result.confidence_scores{"\n"}
                {"{"}
                <span className="text-agree">'gpt-4o'</span>:{" "}
                <span className="text-warm">0.87</span>,{"\n"}{" "}
                <span className="text-agree">'claude-sonnet-4-5'</span>:{" "}
                <span className="text-warm">0.82</span>,{"\n"}{" "}
                <span className="text-agree">'gemini-2.0-flash'</span>:{" "}
                <span className="text-warm">0.64</span>
                {"}"}
                {"\n\n"}
                <span className="text-ink-muted select-none">{">>>"}</span>
                result.dissent_report{"\n"}
                <span className="text-agree">
                  "Gemini 2.0: Team has K8s experience..."
                </span>
                {"\n\n"}
                <span className="text-ink-muted select-none">{">>>"}</span>
                result.audit_trail[<span className="text-warm">0</span>]{"\n"}
                AuditEntry(phase=
                <span className="text-agree">'challenge'</span>,{"\n"} actor=
                <span className="text-agree">'gemini-2.0-flash'</span>, ...)
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* RESEARCH */}
      <section id="research" className="py-32">
        <div className="container-narrow">
          <Reveal>
            <div className="eyebrow mb-5">Research</div>
            <h2 className="section-heading mb-4 text-[clamp(32px,4.5vw,52px)] max-w-[720px]">
              Not a reading list.
              <br />
              <em>A spec.</em>
            </h2>
            <p className="text-[16px] leading-[1.6] text-ink-secondary max-w-[560px] mb-14">
              Each paper below maps to a specific Consilium feature. The
              deliberation protocol implements peer-reviewed findings, not
              vibes.
            </p>
          </Reveal>

          <Reveal delay={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {papers.map((paper) => (
                <article
                  key={paper.title}
                  className="surface-card hoverable px-7 py-7"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-3">
                    {paper.cite}
                  </div>
                  <h4 className="font-display italic font-normal text-[19px] leading-[1.3] tracking-[-0.01em] text-ink-primary mb-3">
                    {paper.title}
                  </h4>
                  <p className="text-[13px] text-ink-secondary leading-[1.55] mb-4">
                    {paper.body}
                  </p>
                  <div className="text-[12px] text-warm font-mono tracking-[0.02em] pt-3.5 border-t border-white/[0.08] flex items-center gap-2">
                    <span className="text-ink-tertiary">→</span> {paper.powers}
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-white/[0.08] py-28 text-center">
        <div className="container-narrow">
          <Reveal>
            <h2 className="font-display font-light text-[clamp(40px,6vw,72px)] tracking-[-0.03em] leading-[1.02] mb-6 text-ink-primary">
              Ship answers
              <br />
              that <em className="italic text-warm font-light">hold up.</em>
            </h2>
            <p className="text-[17px] text-ink-secondary max-w-[560px] mx-auto mb-9">
              Enterprise-grade deliberation. Your keys, your models, your
              complete audit trail.
            </p>
            <div className="flex justify-center flex-wrap gap-3">
              <Link
                href="/council"
                className="btn-consilium btn-consilium-primary btn-consilium-lg"
              >
                Try the Council ↗
              </Link>
              <Link href="/pricing" className="btn-consilium btn-consilium-lg">
                See pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
