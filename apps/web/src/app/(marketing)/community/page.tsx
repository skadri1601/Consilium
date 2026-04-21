import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import {
  Github,
  MessageCircle,
  BookOpen,
  Heart,
  Code2,
  GitPullRequest,
  Bug,
  Puzzle,
  Bot,
  FileText,
  TestTube,
  Rocket,
  Users,
  Blocks,
  Sparkles,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";

export const metadata: Metadata = buildMetadata({
  title: "Community",
  description: "Join the Consilium community on GitHub and Discord. Contribute code, file issues, and help shape multi-AI deliberation tooling.",
  path: "/community",
});

const links = [
  {
    icon: MessageCircle,
    title: "GitHub Discussions",
    description: "Ask questions, share use cases, propose features, get help from the community and maintainers, and browse existing solutions.",
    href: "https://github.com/skadri1601/Consilium/discussions",
    cta: "Join the Discussion",
  },
  {
    icon: BookOpen,
    title: "Contributing Guide",
    description: "Learn how to contribute code, documentation, bug reports, feature requests, and templates. Includes setup instructions and code style conventions.",
    href: "https://github.com/skadri1601/Consilium/blob/main/CONTRIBUTING.md",
    cta: "Read the Guide",
  },
  {
    icon: MessageCircle,
    title: "Discord",
    description: "Real-time chat with the community and maintainers. Share your deliberations, ask for help, and collaborate on features.",
    href: "#",
    cta: "Coming Soon",
    disabled: true,
  },
  {
    icon: Github,
    title: "GitHub Repository",
    description: "Star the repo, fork it, browse source code, track releases, view CI/CD pipelines, and follow the project roadmap.",
    href: "https://github.com/skadri1601/Consilium",
    cta: "View on GitHub",
  },
];

const contributionTypes = [
  {
    icon: Bug,
    title: "Bug Fixes",
    description: "Check GitHub Issues for \"good first issue\" labels. Fix a bug, write a test, submit a PR.",
  },
  {
    icon: Sparkles,
    title: "New Features",
    description: "Propose new features in GitHub Discussions first. Once approved, implement and submit a PR.",
  },
  {
    icon: Puzzle,
    title: "New Deliberation Modes",
    description: "Extend the mode enum and add a phase handler in deliberation_graph.py. Follow existing mode patterns.",
  },
  {
    icon: Bot,
    title: "New AI Providers",
    description: "Implement the BaseAgent interface: generate_response, stream_response, and health_check methods.",
  },
  {
    icon: FileText,
    title: "Vertical Templates",
    description: "Add to the templates/ directory with mode, rubric, and system_prompts configuration.",
  },
  {
    icon: TestTube,
    title: "Tests",
    description: "Add to existing suites: Vitest for web, NestJS spec files for API, pytest for the agents engine.",
  },
];

const roadmapItems = [
  {
    status: "live",
    label: "Live",
    items: ["8 deliberation modes","5 providers, 15 models","6 vertical templates","TypeScript & Python SDKs","CLI with streaming","Cost estimation","Audit trails","Docker self-hosting",
    ],
  },
  {
    status: "soon",
    label: "Coming Soon",
    items: ["Discord community","Custom mode builder","Plugin system","Additional providers","Webhook notifications","Team workspaces",
    ],
  },
  {
    status: "planned",
    label: "Long-Term",
    items: ["Template marketplace","Enterprise SSO / SAML","On-premise managed deployment","Custom model fine-tuning integration","Multi-language SDK support","Visual deliberation editor",
    ],
  },
];

const statusColors: Record<string, string> = {
  live: "bg-agree/14 text-agree border-agree/30",
  soon: "bg-warm/20 text-warm border-warm/30",
  planned: "bg-warm/20 text-warm border-warm/30",
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5">Community</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Contribute to the <em>council.</em>
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-ink-secondary">
            Join the open-source community building structured deliberation tooling. Discussions, contributing guide, roadmap.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-center mb-10">Get Involved</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                target={item.disabled ? undefined : "_blank"}
                rel={item.disabled ? undefined : "noreferrer"}
                className={item.disabled ? "pointer-events-none" : "group"}
              >
                <Card
                  className={`h-full transition-all ${item.disabled ? "opacity-50" : "hover:border-white/[0.12] hover:scale-[1.01]"}`}
                >
                  <CardHeader>
                    <Icon className="h-8 w-8 mb-2 text-warm" />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription>{item.description}</CardDescription>
                    <span
                      className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium ${
                        item.disabled
                          ? "border border-input bg-background text-muted-foreground"
                          : "bg-warm hover:bg-warm-bright text-white"
                      }`}
                    >
                      {item.cta}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <GitPullRequest className="h-7 w-7 text-warm" />
              <h2 className="text-3xl font-bold">For Contributors</h2>
            </div>
            <p className="text-muted-foreground">
              Everything you need to start contributing to Consilium
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-bg-1 p-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Code2 className="h-5 w-5 text-warm" />
              <h3 className="text-xl font-semibold">Development Setup</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Prerequisites
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                    Node.js 20+
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                    pnpm (package manager)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                    Python 3.11+
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                    Docker & Docker Compose
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Monorepo Structure
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                    apps/web — Next.js 15 frontend
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                    apps/api — NestJS 11 API server
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                    apps/agents — FastAPI debate engine
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                    packages/ — CLI, SDK, Python SDK, shared types, database
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-bg-0 border border-white/[0.08] p-4">
              <code className="text-sm text-muted-foreground leading-relaxed block">
                <span className="text-agree">$</span> git clone
                https://github.com/skadri1601/Consilium.git
                <br />
                <span className="text-agree">$</span> cd Consilium && pnpm
                install
                <br />
                <span className="text-agree">$</span> cp .env.example .env
                <br />
                <span className="text-agree">$</span> docker compose up -d
                <br />
                <span className="text-agree">$</span> pnpm dev
              </code>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-center mb-8">
            Ways to Contribute
          </h3>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contributionTypes.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-white/[0.08] bg-bg-1/60 p-6"
                >
                  <Icon className="h-6 w-6 text-warm mb-3" />
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-bg-1 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Blocks className="h-5 w-5 text-warm" />
              <h3 className="text-xl font-semibold">Code Conventions</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 shrink-0 text-warm" />
                  No comments in code — use descriptive names
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 shrink-0 text-warm" />
                  Shared types in packages/shared/ — never duplicate
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 shrink-0 text-warm" />
                  Python: direct imports, Pydantic models, validated inputs
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 shrink-0 text-warm" />
                  TypeScript: strict mode, shadcn/ui components, Tailwind CSS
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 shrink-0 text-warm" />
                  Run lint + typecheck before submitting PRs
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 shrink-0 text-warm" />
                  Follow existing patterns in neighboring files
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Rocket className="h-7 w-7 text-warm" />
              <h2 className="text-3xl font-bold">Roadmap</h2>
            </div>
            <p className="text-muted-foreground">
              Where Consilium is headed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {roadmapItems.map((group) => (
              <div key={group.status}>
                <div className="mb-6">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusColors[group.status]}`}
                  >
                    {group.label}
                  </span>
                </div>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          group.status === "live"
                            ? "bg-green-400"
                            : group.status === "soon"
                              ? "bg-indigo-400"
                              : "bg-purple-400"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto rounded-2xl border border-white/[0.08] bg-bg-1 p-8 text-center">
          <Heart className="h-8 w-8 mx-auto mb-4 text-dissent" />
          <p className="text-lg font-medium mb-2">
            Built by Saad Kadri and contributors
          </p>
          <p className="text-muted-foreground mb-6">
            Consilium is MIT licensed and welcomes contributions from developers
            of all skill levels.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="https://github.com/skadri1601/Consilium"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-md bg-warm hover:bg-warm-bright px-6 text-sm font-medium text-white shadow-lg transition-all  hover:shadow-xl"
            >
              <Github className="mr-2 h-4 w-4" />
              Star on GitHub
            </Link>
            <Link
              href="https://github.com/skadri1601/Consilium/discussions"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Users className="mr-2 h-4 w-4" />
              Join Discussions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
