import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://myconsilium.xyz"
).replace(/\/$/, "");
export const SITE_NAME = "Consilium";
export const SITE_TAGLINE = "The AI Council";
export const SITE_DESCRIPTION =
  "Consilium is a multi-AI council that debates, critiques, and synthesizes consensus answers. Pit GPT, Claude, Gemini, Llama, and Grok against each other and get the best recommendation.";
export const SITE_TWITTER = "@consiliumai";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/consilium-logo.svg`;

export type PageSeo = {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function buildMetadata({
  title,
  description,
  path,
  image,
  noindex,
  keywords,
  type = "website",
  publishedTime,
  modifiedTime,
}: PageSeo): Metadata {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const resolvedDescription = description ?? SITE_DESCRIPTION;
  const resolvedImage = image ?? DEFAULT_OG_IMAGE;
  const resolvedTitle = title ?? `${SITE_NAME} – ${SITE_TAGLINE}`;

  return {
    title,
    description: resolvedDescription,
    keywords,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [
        { url: resolvedImage, width: 1200, height: 630, alt: SITE_NAME },
      ],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER,
      creator: SITE_TWITTER,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [resolvedImage],
    },
  };
}
