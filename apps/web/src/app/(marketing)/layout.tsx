import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";

const navItems = [
  { title: "How It Works", href: "/#how-it-works" },
  { title: "Modes", href: "/#modes" },
  { title: "SDK", href: "/#sdk" },
  { title: "About", href: "/about" },
  { title: "GitHub", href: "https://github.com/skadri1601/Consilium", external: true },
];

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader items={navItems} />
      <main className="flex-1 pt-18">{children}</main>
      <MarketingFooter
        builtBy="Saad Kadri"
        builtByLink="https://saadkadri.dev"
        githubLink="https://github.com/skadri1601/"
        twitterLink="https://twitter.com"
        linkedinLink="https://www.linkedin.com/in/saad-kadri-58b8bb205/"
      />
    </div>
  );
}

