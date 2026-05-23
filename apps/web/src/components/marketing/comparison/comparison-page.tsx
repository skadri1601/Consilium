import Link from "next/link";
import { Check, Minus, ArrowRight, Scale } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbList } from "@/lib/structured-data";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import type { CompetitorComparison } from "./types";

interface Props {
  data: CompetitorComparison;
}

export function ComparisonPage({ data }: Props) {
  const path = `/vs-${data.slug}`;
  const url = `${SITE_URL}${path}`;
  const breadcrumbs = breadcrumbList([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/" },
    { name: `vs ${data.competitor}`, path },
  ]);
  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "[data-speakable]"],
    },
  };
  const articleSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.pageTitle,
    description: data.metaDescription,
    image: `${SITE_URL}/og.png`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: data.lastUpdated,
    dateModified: data.lastUpdated,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/consilium-icon.svg`,
      },
    },
    about: {
      "@type": "Thing",
      name: data.competitor,
    },
  };

  return (
    <div className="min-h-screen">
      <JsonLd id={`ld-vs-${data.slug}-breadcrumbs`} data={breadcrumbs} />
      <JsonLd id={`ld-vs-${data.slug}-article`} data={articleSchema} />
      <JsonLd id={`ld-vs-${data.slug}-speakable`} data={speakableSchema} />

      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            <Scale className="h-3 w-3 mr-1" />
            Honest Comparison
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {SITE_NAME} vs {data.competitor}
          </h1>
          {data.hero.answerCapsule && (
            <p
              data-speakable
              className="text-lg md:text-xl text-foreground/90 max-w-3xl mx-auto mb-6 leading-relaxed"
            >
              {data.hero.answerCapsule}
            </p>
          )}
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-3">
            {data.hero.tagline}
          </p>
          <p className="text-base text-muted-foreground/80 max-w-3xl mx-auto">
            {data.hero.hook}
          </p>
        </div>
      </section>

      {data.stats && data.stats.length > 0 && (
        <section className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              {data.stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground/70">
                    {stat.label}
                  </dt>
                  <dd className="text-2xl font-semibold text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-3xl mx-auto space-y-5">
          {data.hero.intro.map((paragraph, idx) => (
            <p
              key={idx}
              className="text-base md:text-lg text-muted-foreground leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
          {data.competitorQuote && (
            <figure className="my-8 border-l-4 border-indigo-500/40 pl-5 py-2">
              <blockquote className="text-base md:text-lg italic text-foreground/85 leading-relaxed">
                &ldquo;{data.competitorQuote.text}&rdquo;
              </blockquote>
              <figcaption className="mt-2 text-xs text-muted-foreground">
                &mdash;{" "}
                {data.competitorQuote.href ? (
                  <a
                    href={data.competitorQuote.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    {data.competitorQuote.source}
                  </a>
                ) : (
                  <span>{data.competitorQuote.source}</span>
                )}
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            What does the side-by-side feature matrix show?
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">
                        Capability
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-indigo-400">
                        {SITE_NAME}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        {data.competitor}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.matrix.map((row) => (
                      <tr
                        key={row.feature}
                        className="border-b border-border/50 last:border-b-0"
                      >
                        <td className="py-3 px-4 font-medium">
                          {row.feature}
                          {row.note && (
                            <div className="text-xs text-muted-foreground/70 mt-1 font-normal">
                              {row.note}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-start gap-2">
                            {row.consiliumHas ? (
                              <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            )}
                            <span className="text-muted-foreground">
                              {row.consilium}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-start gap-2">
                            {row.competitorHas ? (
                              <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            )}
                            <span className="text-muted-foreground">
                              {row.competitor}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground/60 mt-3 text-center">
            Last reviewed{" "}
            {new Date(data.lastUpdated).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Where does {data.competitor} win?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.competitorStrengths.map((strength) => (
                  <li
                    key={strength}
                    className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed"
                  >
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-indigo-500/20 bg-indigo-500/[0.02]">
            <CardHeader>
              <CardTitle className="text-lg text-indigo-400">
                Where does {SITE_NAME} win?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {data.consiliumWins.map((win) => (
                  <li key={win.title} className="space-y-1">
                    <p className="text-sm font-semibold">{win.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {win.body}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            How does {SITE_NAME} fit alongside {data.competitor}?
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            How {SITE_NAME} fits alongside (or replaces) {data.competitor} in
            real engineering workflows.
          </p>
          <div className="space-y-6">
            {data.workflows.map((wf) => (
              <Card key={wf.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{wf.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {wf.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            What are the most common questions?
          </h2>
          <div className="space-y-8">
            {data.faq.map((entry) => (
              <div key={entry.question}>
                <h3 className="text-lg font-semibold mb-2">{entry.question}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {entry.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">How do I try {SITE_NAME}?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Free tier includes managed pool access - no API keys required to get
            started. BYOK supported for production usage.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/cli"
              className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              Install the CLI
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              Pricing
            </Link>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50">
            <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-4">
              Compare with
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {OTHER_COMPETITORS.filter((c) => c.slug !== data.slug).map(
                (c) => (
                  <Link
                    key={c.slug}
                    href={`/vs-${c.slug}`}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    vs {c.name}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const OTHER_COMPETITORS = [
  { slug: "cursor", name: "Cursor" },
  { slug: "aider", name: "Aider" },
  { slug: "cline", name: "Cline" },
  { slug: "claude-code", name: "Claude Code" },
  { slug: "copilot", name: "GitHub Copilot" },
];
