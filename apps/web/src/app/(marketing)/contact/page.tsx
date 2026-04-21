import Link from "next/link";
import type { Metadata } from "next";
import { Mail, Github, Linkedin, AlertTriangle, Bug } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/shared/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with the Consilium team. Bug reports, feature requests, security disclosures, and partnerships.",
  path: "/contact",
});

const channels = [
  {
    icon: Mail,
    title: "Email",
    value: "saad@myconsilium.xyz",
    href: "mailto:saad@myconsilium.xyz",
    description: "General inquiries, partnerships, and enterprise plans",
  },
  {
    icon: Github,
    title: "GitHub",
    value: "github.com/skadri1601/Consilium",
    href: "https://github.com/skadri1601/Consilium",
    description: "Source code, issues, and discussions",
  },
  {
    icon: Linkedin,
    title: "LinkedIn",
    value: "Saad Kadri",
    href: "https://www.linkedin.com/in/saad-kadri-58b8bb205",
    description: "Professional networking and updates",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5">Contact</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Say <em>hello.</em>
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-ink-secondary">
            Bug reports, security disclosures, partnerships, and general
            inquiries — we'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="grid gap-6">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <Link
                  key={channel.title}
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group"
                >
                  <Card className="transition-all hover:border-white/[0.12] hover:scale-[1.005]">
                    <CardContent className="flex items-center gap-6 p-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warm/12">
                        <Icon className="h-6 w-6 text-warm" />
                      </div>
                      <div>
                        <CardTitle className="text-base mb-1 group-hover:text-warm transition-colors">
                          {channel.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {channel.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {channel.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <Bug className="h-5 w-5 mt-0.5 shrink-0 text-warm-bright" />
                <div>
                  <p className="font-medium mb-1">Bug Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Found a bug? Open an issue on{" "}
                    <Link
                      href="https://github.com/skadri1601/Consilium/issues"
                      target="_blank"
                      rel="noreferrer"
                      className="text-warm hover:underline"
                    >
                      GitHub Issues
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-dissent" />
                <div>
                  <p className="font-medium mb-1">Security Issues</p>
                  <p className="text-sm text-muted-foreground">
                    For security vulnerabilities, please email{" "}
                    <Link
                      href="mailto:saad@myconsilium.xyz"
                      className="text-warm hover:underline"
                    >
                      saad@myconsilium.xyz
                    </Link>{" "}
                    directly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
