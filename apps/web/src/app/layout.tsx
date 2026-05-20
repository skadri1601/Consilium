import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { Toaster } from "@/shared/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { TestModeClerkProvider } from "@/components/test-mode-clerk-provider";
import { ThemeProvider } from "@/app/provider";
import { PostHogProvider } from "@/components/posthog-provider";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_TWITTER,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo";
import { SAAD_AUTHOR, SAAD_AUTHOR_ID } from "@/lib/authors";
import "@/styles/globals.css";

const inter = localFont({
  src: "../fonts/Inter.woff2",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "consilium",
    "ai council",
    "multi-agent debate",
    "llm debate",
    "ai deliberation",
    "gpt vs claude",
    "ai synthesis",
    "ai consensus",
    "prompt engineering",
    "ai agents",
  ],
  authors: [{ name: "Saad Kadri", url: "https://saadkadri.dev" }],
  creator: "Saad Kadri",
  publisher: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: SITE_URL,
      "x-default": SITE_URL,
    },
    types: {
      "application/rss+xml": [
        { url: `${SITE_URL}/feed.xml`, title: `${SITE_NAME} blog` },
      ],
    },
  },
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} – ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_TWITTER,
    creator: SITE_TWITTER,
    title: `${SITE_NAME} – ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION
        ? {
            "yandex-verification":
              process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION,
          }
        : {}),
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const ORGANIZATION_ID = `${SITE_URL}#organization`;
const SOFTWARE_ID = `${SITE_URL}#software`;
const WEBSITE_ID = `${SITE_URL}#website`;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/brand/consilium-logo.svg`,
  },
  founder: { "@id": SAAD_AUTHOR_ID },
  sameAs: ["https://www.linkedin.com/in/saad-kadri-58b8bb205/"],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": SOFTWARE_ID,
  name: SITE_NAME,
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "AI Council / Multi-Agent Deliberation",
  operatingSystem: "Web, macOS, Linux, Windows",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/og.png`,
  screenshot: `${SITE_URL}/og.png`,
  softwareVersion: "0.4.0",
  downloadUrl: "https://www.npmjs.com/package/@myconsilium/cli",
  installUrl: `${SITE_URL}/docs/getting-started`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier with BYOK or managed pool",
    url: `${SITE_URL}/pricing`,
  },
  featureList: [
    "Multi-AI debate across 7 LLM providers (Anthropic, OpenAI, Google, Groq, xAI, Moonshot, OpenRouter)",
    "8 deliberation modes: quick, council, deep, blind, redteam, jury, market, auto",
    "Plan mode with approve/refine/cancel before any write tool runs",
    "Live TODO checklist rendered in TUI during debate streaming",
    "Checkpoint and rewind for code+chat state (with auto-pre-restore snapshots)",
    "Conversation fork/branch via /fork",
    "@file mention syntax and !shell passthrough in chat REPL",
    "/context colored grid visualization of token usage",
    "Interactive /diff navigator with arrow-key hunk paging",
    "User-definable slash commands from ~/.consilium/commands/*.md",
    "User-definable sub-agents from ~/.consilium/agents/*.md",
    "Lifecycle hooks: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop, SessionEnd",
    "MCP server support + marketplace browser with 12 seeded servers",
    "Web search grounding via DuckDuckGo, Brave, and Google Custom Search",
    "Image generation via DALL-E 3 and xAI (/dream, /imagine, --generate-image)",
    "Voice dictation via OpenAI Whisper (consilium voice)",
    "Git worktree isolation per task (--worktree)",
    "OS sandbox: macOS Seatbelt, Linux bwrap (--sandbox)",
    "Workspace trust file with always/session levels (/trust)",
    "Background agents with supervisor daemon (consilium agents)",
    "Standalone scheduler daemon for cron-style /loop and /schedule firing",
    "Headless output formats: text, json, stream-json with --json-schema validation",
    "Per-run cost and turn caps: --max-budget-usd, --max-turns",
    "Long-lived CI tokens via consilium setup-token (365-day default)",
    "Permission grammar with per-glob and per-domain rules: Bash(), Read(), Write(), WebFetch(domain:), Mcp()",
    "Permission-mode cycle (Shift+Tab): default, acceptEdits, auto, plan, bypass",
    "Autonomy controls: /loop, /goal, /schedule with persistence and replay",
    "Auto memory: project-scoped MEMORY.md written from session synthesis",
    "Session analytics: /insights and /team-onboarding from 30-day session history",
    "Diagnostic suite: /recap, /stop, /doctor, /heapdump, /verify",
    "Provider key health check across all 7 BYOK providers",
    "VS Code extension with sessions tree, status bar, and SSE debate panel",
    "Linear MYC ticket integration (list/view/create/update/debate)",
    "Reasoning effort: --effort low/medium/high/xhigh/max maps to Anthropic extended thinking, OpenAI/xAI reasoning",
    "Shell completions (bash/zsh/fish) and man page",
    "8 themes: default, dark, light, high-contrast, matrix, ocean, sunset, monokai",
    "TUI fullscreen mode (/tui) with alt-screen rendering",
    "Vim mode in chat REPL (CONSILIUM_VIM_MODE=1)",
    "Status line with cwd, branch, model, mode indicators",
    "apiKeyHelper for shell-script-based dynamic provider auth",
    "TypeScript SDK + Python SDK + CLI",
    "Atomic edit application with rollback snapshots",
    "Pre-flight cost estimation before each debate",
    "BYOK with zero markup + Groq and OpenRouter free-tier fallback pool",
  ],
  author: { "@id": SAAD_AUTHOR_ID },
  publisher: { "@id": ORGANIZATION_ID },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": ORGANIZATION_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/docs?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const personJsonLd = { "@context": "https://schema.org", ...SAAD_AUTHOR };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <TestModeClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <link rel="me" href="https://saadkadri.dev" />
        </head>
        <body className={`${inter.className} antialiased font-normal`}>
          <Script
            id="ld-organization"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationJsonLd),
            }}
          />
          <Script
            id="ld-person-founder"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
          />
          <Script
            id="ld-software"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
          />
          <Script
            id="ld-website"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            forcedTheme="dark"
          >
            <PostHogProvider>
              <ErrorBoundary>
                <OnboardingProvider>
                  {children}
                  <Toaster />
                </OnboardingProvider>
              </ErrorBoundary>
            </PostHogProvider>
          </ThemeProvider>
        </body>
      </html>
    </TestModeClerkProvider>
  );
}
