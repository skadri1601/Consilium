import { Hero } from "@/components/hero";
import { FeatureGrid } from "@/components/features";
import { Zap, Shield, Code, Activity, FileText, Settings } from "lucide-react";

const features = [
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Open Source",
    description:
      "Fully open source. Self-host or contribute to the project on GitHub.",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Bring Your Own Keys",
    description:
      "Use your own API keys for OpenAI, Anthropic, Google, XAI, and Groq. Your keys, your control.",
  },
  {
    icon: <Code className="h-8 w-8" />,
    title: "Latest AI Models",
    description:
      "Claude Opus 4.6, Sonnet 4.5, GPT-4o, o1, Gemini 2.0, Grok, and more. Mix the best models for optimal results.",
  },
  {
    icon: <Activity className="h-8 w-8" />,
    title: "Real-Time Streaming",
    description:
      "Watch agents debate in real-time with Server-Sent Events streaming.",
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: "Export Formats",
    description:
      "Export synthesis as Markdown, .cursorrules files, or plain text.",
  },
  {
    icon: <Settings className="h-8 w-8" />,
    title: "Self-Hostable",
    description:
      "Run Consilium on your own infrastructure with Docker Compose.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Hero
        capsuleText="🎉 Now supporting Claude Opus 4.6, Sonnet 4.5, GPT-4o & more"
        capsuleLink="https://github.com/skadri1601/"
        title="Multi-Agent Debate for Better Prompts"
        subtitle="Get a clear, synthesized recommendation. Consilium runs multiple AI models in debate and produces a single prompt you can use in Cursor, Copilot, or any editor."
        primaryCtaText="Get Started"
        primaryCtaLink="/sign-up"
        secondaryCtaText="View on GitHub"
        secondaryCtaLink="https://github.com/skadri1601/"
      />

      <FeatureGrid
        title="Features"
        subtitle="Everything you need to build better prompts with multi-agent AI debate."
        items={features}
      />
    </>
  );
}
