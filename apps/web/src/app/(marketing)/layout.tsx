import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { GrainOverlay } from "@/components/shared/grain-overlay";

const navItems = [
  { title: "How it works", href: "/#how" },
  { title: "Modes", href: "/#modes" },
  { title: "Compare", href: "/#compare" },
  { title: "Docs", href: "/docs" },
  { title: "Pricing", href: "/pricing" },
];

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-bg-0 text-ink-primary">
      <GrainOverlay />
      <MarketingHeader items={navItems} />
      <main className="relative z-10 flex-1 pt-16">{children}</main>
      <MarketingFooter
        builtBy="Saad Kadri"
        builtByLink="https://saadkadri.dev"
        githubLink="https://github.com/skadri1601/Consilium"
        twitterLink="https://twitter.com"
        linkedinLink="https://www.linkedin.com/in/saad-kadri-58b8bb205/"
      />
    </div>
  );
}
