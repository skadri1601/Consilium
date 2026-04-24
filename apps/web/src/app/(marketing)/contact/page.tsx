import Link from "next/link";
import type { Metadata } from "next";
import { Mail, Linkedin, AlertTriangle, Bug } from "lucide-react";
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
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-muted-foreground">
            We&apos;d love to hear from you
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
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                        <Icon className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base mb-1 group-hover:text-indigo-400 transition-colors">
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
                <Bug className="h-5 w-5 mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-medium mb-1">Bug Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Found a bug? Email{" "}
                    <Link
                      href="mailto:saad@myconsilium.xyz"
                      className="text-indigo-400 hover:underline"
                    >
                      saad@myconsilium.xyz
                    </Link>{" "}
                    with repro steps.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="font-medium mb-1">Security Issues</p>
                  <p className="text-sm text-muted-foreground">
                    For security vulnerabilities, please email{" "}
                    <Link
                      href="mailto:saad@myconsilium.xyz"
                      className="text-indigo-400 hover:underline"
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
