import { SITE_NAME, SITE_URL } from "./seo";

/**
 * JSON-LD structured data builders. Each returns a plain object that
 * the caller injects via <script type="application/ld+json"> on the
 * page that owns it.
 *
 * Schema choices reflect 2026 dual-target guidance:
 *   - Article on /blog/<slug>           (Top Stories eligibility)
 *   - BreadcrumbList on nested routes   (clean SERP path, ~10% CTR lift)
 *   - Person on /about (founder)        (Knowledge Graph "founded by")
 *   - SoftwareApplication site-wide     (already in layout.tsx)
 *   - FAQPage on /faq                   (AEO: Perplexity, ChatGPT search,
 *                                        Claude, and Google AI Overviews
 *                                        all consume FAQPage even though
 *                                        Google's classic FAQ rich result
 *                                        is restricted to gov/health)
 *   - HowTo on /docs/getting-started    (AEO: directly cited as steps in
 *                                        AI assistant "how do I" answers)
 *   - VideoObject for the brand video   (Bing/AI Overviews video carousel)
 *   - SpeakableSpecification on FAQ     (voice assistants: Google, Alexa)
 */

export interface BreadcrumbItem {
  name: string;
  /** Project-relative path. Joined with SITE_URL to produce the absolute URL. */
  path: string;
}

export function breadcrumbList(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  /** ISO 8601 date string (YYYY-MM-DD or full timestamp). */
  publishedTime?: string;
  /** ISO 8601 date string. Falls back to publishedTime. */
  modifiedTime?: string;
  /** Optional author override; defaults to the SITE_NAME organization. */
  authorName?: string;
  /** Absolute or root-relative image URL. Defaults to the og.png card. */
  image?: string;
}

export function articleSchema(
  input: ArticleSchemaInput,
): Record<string, unknown> {
  const url = `${SITE_URL}/blog/${input.slug}`;
  const image = input.image
    ? input.image.startsWith("http")
      ? input.image
      : `${SITE_URL}${input.image}`
    : `${SITE_URL}/og.png`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(input.publishedTime ? { datePublished: input.publishedTime } : {}),
    dateModified:
      input.modifiedTime ?? input.publishedTime ?? new Date().toISOString(),
    author: input.authorName
      ? {
          "@type": "Person",
          name: input.authorName,
        }
      : {
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
  };
}

export interface PersonSchemaInput {
  name: string;
  url?: string;
  jobTitle?: string;
  worksForName?: string;
  sameAs?: string[];
  image?: string;
}

export function personSchema(
  input: PersonSchemaInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    ...(input.url ? { url: input.url } : {}),
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(input.image
      ? {
          image: input.image.startsWith("http")
            ? input.image
            : `${SITE_URL}${input.image}`,
        }
      : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.worksForName
      ? {
          worksFor: {
            "@type": "Organization",
            name: input.worksForName,
            url: SITE_URL,
          },
        }
      : {}),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * FAQPage schema. Google restricts the classic rich-result snippet to
 * gov/health verticals, but AI answer engines (Perplexity, ChatGPT
 * search, Claude, Google AI Overviews, Bing Chat) all read FAQPage
 * structured data and quote it directly with citation back to the
 * source URL. Worth shipping even when the SERP UI doesn't render it.
 */
export function faqPage(
  faqs: FaqEntry[],
  options: { url?: string; speakable?: boolean } = {},
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(options.url ? { url: options.url } : {}),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  if (options.speakable) {
    base.speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "[data-speakable]"],
    };
  }
  return base;
}

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export interface HowToSchemaInput {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
  estimatedCost?: { value: string; currency: string };
  url?: string;
  image?: string;
  supplies?: string[];
  tools?: string[];
}

/**
 * HowTo schema. The most directly-quoted schema in AI assistant
 * "how do I get started with X" answers - Perplexity and ChatGPT both
 * lift the step list verbatim with attribution.
 */
export function howToSchema(input: HowToSchemaInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    ...(input.url ? { url: input.url } : {}),
    ...(input.image
      ? {
          image: input.image.startsWith("http")
            ? input.image
            : `${SITE_URL}${input.image}`,
        }
      : {}),
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    ...(input.estimatedCost
      ? {
          estimatedCost: {
            "@type": "MonetaryAmount",
            currency: input.estimatedCost.currency,
            value: input.estimatedCost.value,
          },
        }
      : {}),
    ...(input.supplies?.length
      ? {
          supply: input.supplies.map((name) => ({
            "@type": "HowToSupply",
            name,
          })),
        }
      : {}),
    ...(input.tools?.length
      ? {
          tool: input.tools.map((name) => ({
            "@type": "HowToTool",
            name,
          })),
        }
      : {}),
    step: input.steps.map((step, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
      ...(step.image
        ? {
            image: step.image.startsWith("http")
              ? step.image
              : `${SITE_URL}${step.image}`,
          }
        : {}),
    })),
  };
}

export interface VideoObjectSchemaInput {
  name: string;
  description: string;
  contentUrl: string;
  thumbnailUrl: string;
  uploadDate: string;
  /** ISO 8601 duration, e.g. "PT1M30S" */
  duration?: string;
  embedUrl?: string;
}

export function videoObjectSchema(
  input: VideoObjectSchemaInput,
): Record<string, unknown> {
  const absolute = (u: string) =>
    u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? u : `/${u}`}`;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: input.name,
    description: input.description,
    contentUrl: absolute(input.contentUrl),
    thumbnailUrl: absolute(input.thumbnailUrl),
    uploadDate: input.uploadDate,
    ...(input.duration ? { duration: input.duration } : {}),
    ...(input.embedUrl ? { embedUrl: absolute(input.embedUrl) } : {}),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/consilium-icon.svg`,
      },
    },
  };
}

/**
 * SpeakableSpecification - annotation that voice assistants
 * (Google Assistant, Alexa, Siri shortcuts) prefer when picking a
 * sentence to read aloud from a page. Attach as the ``speakable``
 * field on a WebPage / Article / FAQPage object.
 */
export function speakableSpec(cssSelectors: string[]): Record<string, unknown> {
  return {
    "@type": "SpeakableSpecification",
    cssSelector: cssSelectors,
  };
}

export interface TechArticleSchemaInput {
  title: string;
  description: string;
  /** Project-relative path. Joined with SITE_URL. */
  path: string;
  /** ISO 8601 date string. */
  publishedTime?: string;
  modifiedTime?: string;
  /** "Beginner" | "Intermediate" | "Expert" - surfaces in AI assistant filters. */
  proficiencyLevel?: "Beginner" | "Intermediate" | "Expert";
  /** Free-text dependencies (e.g. "Node.js >=18", "An API key"). */
  dependencies?: string;
  /** Optional reference to the canonical author entity by @id. */
  authorId?: string;
}

/**
 * TechArticle schema. More specific than Article for technical
 * documentation. ChatGPT search and Bing Chat treat TechArticle as
 * authoritative for "how do I" / "set up X" intents and quote the
 * description + first paragraph more aggressively than for plain
 * Article.
 */
export function techArticleSchema(
  input: TechArticleSchemaInput,
): Record<string, unknown> {
  const url = `${SITE_URL}${input.path.startsWith("/") ? input.path : `/${input.path}`}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#techarticle`,
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${SITE_URL}/og.png`,
    inLanguage: "en-US",
    ...(input.publishedTime ? { datePublished: input.publishedTime } : {}),
    dateModified:
      input.modifiedTime ?? input.publishedTime ?? new Date().toISOString(),
    ...(input.proficiencyLevel
      ? { proficiencyLevel: input.proficiencyLevel }
      : {}),
    ...(input.dependencies ? { dependencies: input.dependencies } : {}),
    author: input.authorId
      ? { "@id": input.authorId }
      : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/consilium-icon.svg`,
      },
    },
  };
}

export interface DefinedTermInput {
  term: string;
  description: string;
  /** Optional anchor URL on the same page (e.g. "#condorcet-method"). */
  url?: string;
  /** Authoritative external reference (Wikidata preferred). */
  sameAs?: string;
}

export interface DefinedTermSetInput {
  /** Display name of the glossary, e.g. "Consilium voting glossary". */
  name: string;
  /** Project-relative path of the page that hosts the glossary. */
  path: string;
  description?: string;
  terms: DefinedTermInput[];
}

/**
 * DefinedTermSet schema. AI search engines that handle "what is X" /
 * "define Y" queries pattern-match DefinedTerm entries directly.
 * Attaching authoritative ``sameAs`` links (Wikidata) lets the engine
 * disambiguate the term from common-name collisions.
 */
export function definedTermSetSchema(
  input: DefinedTermSetInput,
): Record<string, unknown> {
  const url = `${SITE_URL}${input.path.startsWith("/") ? input.path : `/${input.path}`}`;
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${url}#glossary`,
    name: input.name,
    url,
    ...(input.description ? { description: input.description } : {}),
    hasDefinedTerm: input.terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.description,
      inDefinedTermSet: `${url}#glossary`,
      ...(t.url ? { url: `${url}${t.url}` } : {}),
      ...(t.sameAs ? { sameAs: t.sameAs } : {}),
    })),
  };
}
