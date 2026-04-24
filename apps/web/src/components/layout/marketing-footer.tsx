import { buttonVariants } from "@/shared/components/ui/button";
import { LinkedInLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Deliberation Modes", href: "/#modes" },
    { label: "Integrations", href: "/#integrations" },
  ],
  Developers: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "CLI", href: "/docs/cli" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Use Cases", href: "/use-cases" },
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
  twitterLink: string;
  linkedinLink: string;
}>;

export function MarketingFooter(props: MarketingFooterProps) {
  return (
    <footer className="relative">
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to experience AI deliberation?
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl"
              >
                Get Started
              </Link>
              <Link
                href="/pricing"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                See pricing
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">
                  {category}
                </h3>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        target={
                          link.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel={
                          link.href.startsWith("http")
                            ? "noreferrer"
                            : undefined
                        }
                        className="text-sm text-neutral-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 sm:flex-row">
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <div className="flex items-center gap-2">
                <img
                  src="/brand/consilium-icon.svg"
                  alt="Consilium"
                  width={20}
                  height={20}
                />
                <span className="text-sm font-medium text-neutral-200">
                  Consilium
                </span>
                <span className="text-sm text-neutral-400">
                  &copy; {new Date().getFullYear()} All rights reserved.
                </span>
              </div>
              <Link
                href={props.builtByLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-400 transition-colors hover:text-neutral-300"
              >
                Built by {props.builtBy}
              </Link>
            </div>
            <div className="flex items-center space-x-1">
              {(
                [
                  { href: props.twitterLink, icon: TwitterLogoIcon },
                  { href: props.linkedinLink, icon: LinkedInLogoIcon },
                ] as const
              ).map((link) => (
                <Link
                  href={link.href}
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  key={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <link.icon className="h-5 w-5 text-neutral-400 transition-colors hover:text-white" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
