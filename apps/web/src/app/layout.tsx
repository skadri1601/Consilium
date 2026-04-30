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
  alternates: { canonical: SITE_URL },
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
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand/consilium-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/brand/consilium-icon.svg",
    apple: "/brand/consilium-icon.svg",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/consilium-logo.svg`,
  sameAs: ["https://www.linkedin.com/in/saad-kadri-58b8bb205/"],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/docs?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <TestModeClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
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
