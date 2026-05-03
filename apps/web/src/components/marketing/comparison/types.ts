export interface FeatureRow {
  feature: string;
  consilium: string;
  competitor: string;
  consiliumHas: boolean;
  competitorHas: boolean;
  /** Optional explanatory note shown beneath the row. */
  note?: string;
}

export interface ComparisonFAQ {
  question: string;
  answer: string;
}

export interface CompetitorPagePoints {
  /** The single sentence that anchors the page. */
  hook: string;
  /** Three to four paragraphs of intro copy. Each is rendered as <p>. */
  intro: string[];
  /** A small tagline shown beneath the page <h1>. */
  tagline: string;
}

export interface CompetitorComparison {
  /** URL slug — used at /vs/<slug>. */
  slug: string;
  /** Display name of the competitor. */
  competitor: string;
  /** Browser tab title and SEO title. */
  pageTitle: string;
  /** Meta description (155 chars max). */
  metaDescription: string;
  /** Keywords for SEO metadata. */
  keywords: string[];
  /** Hero copy shown at the top of the page. */
  hero: CompetitorPagePoints;
  /** What the competitor does well. */
  competitorStrengths: string[];
  /** Where Consilium differs. Each entry is a short headline + paragraph. */
  consiliumWins: { title: string; body: string }[];
  /** Side-by-side feature matrix. */
  matrix: FeatureRow[];
  /** Workflows that show how the two complement each other (or replace). */
  workflows: { title: string; body: string }[];
  /** Common questions paragraphs. NOT shipped as JSON-LD FAQPage. */
  faq: ComparisonFAQ[];
  /** ISO date the page was last meaningfully updated. */
  lastUpdated: string;
}
