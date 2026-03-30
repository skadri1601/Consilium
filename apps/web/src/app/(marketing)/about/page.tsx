import Link from "next/link";
import { Shield, Code, Users, Github } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const values = [
  {
    icon: Shield,
    title: "Open Source First",
    description: "We believe in transparency and community. Consilium is fully open source.",
  },
  {
    icon: Code,
    title: "Developer Experience",
    description: "Built by developers for developers. We prioritize intuitive APIs and great DX.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Our roadmap is shaped by community feedback. We listen to our users.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Building the Future of AI-Powered Development
          </h1>
          <p className="text-xl text-muted-foreground">
            Consilium helps developers harness the power of multi-agent debate
            to create better prompts, ship faster, and build with confidence.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <Card key={value.title}>
                <CardHeader>
                  <Icon className="h-8 w-8 mb-2" />
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Our Story</h2>

          <div className="space-y-6 text-muted-foreground">
            <p>
              Consilium started with a simple observation: prompt engineering is hard.
              Developers spend countless hours iterating on prompts, trying different
              approaches, and debugging unexpected AI outputs. We knew there had to be
              a better way.
            </p>

            <p>
              The breakthrough came when we realized that the same techniques used in
              academic research—structured debate and consensus-building—could be applied
              to AI prompt engineering. By having multiple AI models debate a topic and
              synthesize their responses, we could achieve better results than any single
              model alone.
            </p>

            <p>
              Consilium supports the latest and most powerful AI models including Claude Opus 4.6,
              Claude Sonnet 4.5, GPT-4o, GPT-o1, Gemini 2.0 Flash, Grok from XAI, and Groq models.
              By orchestrating debates between these cutting-edge models, we help developers generate
              better prompts, catch edge cases, and build more robust AI applications.
            </p>

            <p>
              Today, Consilium powers development workflows for developers worldwide.
              We&apos;re committed to remaining open source, developer-first, and
              community-driven. Our mission is to make AI more accessible, predictable,
              and useful for developers everywhere.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <Github className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Contribute to Consilium</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
            We&apos;re open source and welcome contributions from developers of all skill levels.
          </p>

          <Button asChild size="lg">
            <Link href="https://github.com/skadri1601/" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
