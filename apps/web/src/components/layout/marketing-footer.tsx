import Link from "next/link";
import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";
import { BrandMark } from "@/components/shared/brand-mark";

const footerLinks = {
  Product: [
    { label: "How it works", href: "/#how" },
    { label: "Modes", href: "/#modes" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "/docs/providers" },
  ],
  Developers: [
    { label: "Docs", href: "/docs" },
    { label: "API reference", href: "/docs/api" },
    { label: "CLI", href: "/docs/cli" },
    { label: "SDK", href: "/#sdk" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Research", href: "/research" },
    { label: "Use cases", href: "/use-cases" },
    { label: "FAQ", href: "/faq" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

type MarketingFooterProps = Readonly<{
  builtBy: string;
  builtByLink: string;
  githubLink: string;
  twitterLink: string;
  linkedinLink: string;
}>;

export function MarketingFooter(props: MarketingFooterProps) {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-bg-0">
      <div className="container-narrow pt-20 pb-12">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={
                        link.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        link.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-[13px] text-ink-secondary hover:text-ink-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <span className="font-mono text-[11px] tracking-[0.04em] text-ink-tertiary uppercase">
              Consilium · {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href={props.builtByLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-ink-tertiary hover:text-ink-primary transition-colors"
            >
              Built by {props.builtBy}
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href={props.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-ink-tertiary hover:text-ink-primary transition-colors"
              >
                <GitHubLogoIcon className="h-4 w-4" />
              </Link>
              <Link
                href={props.twitterLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-ink-tertiary hover:text-ink-primary transition-colors"
              >
                <TwitterLogoIcon className="h-4 w-4" />
              </Link>
              <Link
                href={props.linkedinLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-ink-tertiary hover:text-ink-primary transition-colors"
              >
                <LinkedInLogoIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
