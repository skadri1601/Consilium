import { buttonVariants } from "@/shared/components/ui/button";
import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { FooterSubscribeForm } from "./footer-subscribe-form";

const footerLinks = {
  Products: [
    { label: "Web App", href: "/" },
    { label: "CLI", href: "/cli" },
    { label: "API Reference", href: "/docs/api" },
    { label: "Pricing", href: "/pricing" },
  ],
  Navigation: [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
    { label: "Modes", href: "/#modes" },
    { label: "FAQ", href: "/faq" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "Use Cases", href: "/use-cases" },
    { label: "Research", href: "/research" },
  ],
  Contact: [
    { label: "About", href: "/about" },
    { label: "Support", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
} as const;

type MarketingFooterProps = Readonly<{
  builtBy: string;
  builtByLink: string;
  twitterLink: string;
  linkedinLink: string;
  githubLink?: string;
}>;

export function MarketingFooter(props: MarketingFooterProps) {
  const year = new Date().getFullYear();

  const socialLinks = [
    props.githubLink
      ? { href: props.githubLink, icon: GitHubLogoIcon, label: "GitHub" }
      : null,
    { href: props.twitterLink, icon: TwitterLogoIcon, label: "X (Twitter)" },
    { href: props.linkedinLink, icon: LinkedInLogoIcon, label: "LinkedIn" },
  ].filter(
    (
      link,
    ): link is { href: string; icon: typeof GitHubLogoIcon; label: string } =>
      link !== null,
  );

  return (
    <footer className="relative overflow-hidden bg-neutral-950">
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12 md:gap-x-6">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              aria-label="Consilium home"
              className="inline-flex items-center"
            >
              <img
                src="/brand/consilium-icon.svg"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12"
              />
            </Link>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="md:col-span-2">
              <h3 className="text-sm font-semibold text-indigo-400">
                {category}
              </h3>
              <ul className="mt-5 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-3">
            <FooterSubscribeForm />
            <div className="mt-6 flex items-center gap-1">
              {socialLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                >
                  <link.icon
                    aria-hidden="true"
                    className="h-5 w-5 text-neutral-400 transition-colors hover:text-white"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 select-none" aria-hidden="true">
          <svg
            viewBox="0 0 1100 220"
            preserveAspectRatio="xMidYMid meet"
            className="h-auto w-full"
            role="presentation"
          >
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="inherit"
              fontWeight={900}
              fontSize={210}
              letterSpacing={-6}
              fill="none"
              stroke="rgb(99 102 241 / 0.45)"
              strokeWidth={1.5}
            >
              Consilium
            </text>
          </svg>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-neutral-800/80 pt-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-500">
            <Link
              href="/terms"
              className="transition-colors hover:text-neutral-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-neutral-300"
            >
              Privacy Policy
            </Link>
            <span>Consilium &copy; {year}</span>
          </div>
          <Link
            href={props.builtByLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
          >
            Built by {props.builtBy}
          </Link>
        </div>
      </div>
    </footer>
  );
}
