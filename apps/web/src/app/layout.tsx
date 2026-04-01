import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/shared/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { TestModeClerkProvider } from "@/components/test-mode-clerk-provider";
import { ThemeProvider } from "@/app/provider";
import "@/styles/globals.css";

const inter = localFont({
  src: "../fonts/Inter.woff2",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Consilium - Council",
  description:
    "Multi-agent debate platform for better prompts and recommendations",
  keywords: ["consilium", "debate", "prompts", "multi-agent", "synthesis"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚖</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TestModeClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${inter.className} antialiased font-normal`}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
            <ErrorBoundary>
              <OnboardingProvider>
                {children}
                <Toaster />
              </OnboardingProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </TestModeClerkProvider>
  );
}
