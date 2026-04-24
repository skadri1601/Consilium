import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";

const navItems = [
  { title: "How It Works", href: "/#how-it-works" },
  { title: "Modes", href: "/#modes" },
  { title: "Blog", href: "/blog" },
  { title: "About", href: "/about" },
];

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader items={navItems} />
      <main className="flex-1">{children}</main>
      <MarketingFooter
        builtBy="Saad Kadri"
        builtByLink="https://saadkadri.dev"
        twitterLink="https://twitter.com"
        linkedinLink="https://www.linkedin.com/in/saad-kadri-58b8bb205/"
      />
    </div>
  );
}

