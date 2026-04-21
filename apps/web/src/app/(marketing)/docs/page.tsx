import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import {
  BookOpen,
  Code,
  Terminal,
  Package,
  Server,
  ArrowRight,
  Layers,
  Cpu,
  GitBranch,
  FileText,
  Blocks,
  Users,
  Wrench,
  Globe,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";

const sections = [
  {
    title: "For Everyone",
    description: "Understand what Consilium does and how to get started",
    items: [
      {
        icon: BookOpen,
        title: "Getting Started",
        description:
          "Set up Consilium and run your first deliberation — via web app, CLI, SDK, or self-hosted.",
        href: "/docs/getting-started",
      },
      {
        icon: Layers,
        title: "Deliberation Modes",
        description:
          "All 8 modes explained: Quick, Council, Deep, Blind, Red Team, Jury, Market, Auto — phases, parameters, use cases.",
        href: "/docs/modes",
      },
      {
        icon: GitBranch,
        title: "How It Works",
        description:
          "The deliberation engine internals: state machine, voting algorithms, convergence detection, dissent clustering, confidence calibration.",
        href: "/docs/how-it-works",
      },
      {
        icon: Cpu,
        title: "AI Providers & Models",
        description:
          "5 providers, 15 models, complete pricing. Anthropic, OpenAI, Google, Groq (free), xAI — with judge priority and fallback system.",
        href: "/docs/providers",
      },
    ],
  },
  {
    title: "For Engineers",
    description: "Integrate Consilium into your applications and workflows",
    items: [
      {
        icon: Code,
        title: "API Reference",
        description:
          "Full REST API: debates, deliberation, agents, personas, analytics. All endpoints with request/response schemas and SSE events.",
        href: "/docs/api",
      },
      {
        icon: Terminal,
        title: "CLI Reference",
        description:
          "12 commands, 20+ slash commands, 5 output formats. Interactive chat, benchmarks, sessions, decision extraction.",
        href: "/docs/cli",
      },
      {
        icon: Package,
        title: "Python SDK",
        description:
          "Sync and async clients, streaming, automatic retries, Pydantic types. Full method reference with examples.",
        href: "/docs/python-sdk",
      },
      {
        icon: Package,
        title: "TypeScript SDK",
        description:
          "Full TypeScript support, typed errors, SSE streaming, AsyncIterable. Complete type definitions.",
        href: "/docs/typescript-sdk",
      },
      {
        icon: Layers,
        title: "Architecture",
        description:
          "System design, data flow, database schema, SSE streaming, auth flow, CI/CD pipeline, error handling.",
        href: "/docs/architecture",
      },
    ],
  },
  {
    title: "For Integrators",
    description:
      "Deploy, customize, and extend Consilium for your organization",
    items: [
      {
        icon: Server,
        title: "Self-Hosting",
        description:
          "Docker Compose deployment, all environment variables, service architecture, health checks, production tips.",
        href: "/docs/self-hosting",
      },
      {
        icon: FileText,
        title: "Vertical Templates",
        description:
          "6 pre-built templates: Code Review, Research, Risk, Healthcare, Legal, Finance — with rubrics, modes, and system prompts.",
        href: "/docs/templates",
      },
      {
        icon: Blocks,
        title: "Deployment",
        description:
          "Self-hosting, Docker Compose, environment variables, production operations, and health checks.",
        href: "/docs/self-hosting",
      },
    ],
  },
];

const notionDocs = [
  {
    icon: BookOpen,
    title: "What is Consilium",
    description: "Product overview and core concepts",
    href: "/docs/notion/what-is-consilium",
  },
  {
    icon: FileText,
    title: "FAQ",
    description: "Frequently asked questions",
    href: "/docs/notion/faq",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description: "Trust center, encryption, data handling",
    href: "/docs/notion/security",
  },
  {
    icon: Globe,
    title: "Research",
    description: "Peer-reviewed papers behind each mode",
    href: "/docs/notion/research",
  },
];

const quickLinks = [
  {
    icon: Users,
    title: "Use Cases",
    description: "How teams use deliberation in practice",
    href: "/use-cases",
  },
  {
    icon: Globe,
    title: "Research",
    description: "Peer-reviewed papers behind Consilium",
    href: "/docs/notion/research",
  },
  {
    icon: Wrench,
    title: "Community",
    description: "Contribute, discuss, and get help",
    href: "/community",
  },
];

export const metadata: Metadata = buildMetadata({
  title: "Documentation",
  description:
    "Consilium documentation — get started, understand the debate modes, integrate the API, CLI, Python SDK, TypeScript SDK, and self-host your own council.",
  path: "/docs",
  keywords: ["consilium docs", "ai council docs", "multi-agent api"],
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Documentation",
      item: `${SITE_URL}/docs`,
    },
  ],
};

export default function DocsPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5">Documentation</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Everything to <em>ship</em>
            <br />
            with the council.
          </h1>
          <p className="mt-6 max-w-[640px] text-[17px] leading-[1.55] text-ink-secondary">
            Understand what Consilium does, integrate the API or SDKs, deploy
            and extend it on your own infrastructure.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-16">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} href={item.href} className="group">
                      <Card className="h-full transition-all hover:border-white/[0.12] hover:scale-[1.01]">
                        <CardHeader>
                          <Icon className="h-7 w-7 mb-2 text-warm" />
                          <CardTitle className="text-base flex items-center gap-2">
                            {item.title}
                            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm leading-relaxed">
                            {item.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">From Notion</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Live content from our documentation workspace
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {notionDocs.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} href={item.href} className="group">
                    <Card className="h-full transition-all hover:border-white/[0.12] hover:scale-[1.01]">
                      <CardHeader>
                        <Icon className="h-7 w-7 mb-2 text-agree" />
                        <CardTitle className="text-base flex items-center gap-2">
                          {item.title}
                          <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm leading-relaxed">
                          {item.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} href={item.href} className="group">
                    <Card className="h-full transition-all hover:border-white/[0.12] hover:scale-[1.01]">
                      <CardHeader className="pb-2">
                        <Icon className="h-6 w-6 mb-1 text-warm" />
                        <CardTitle className="text-sm">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-xs">
                          {item.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
