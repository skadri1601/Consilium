import Link from "next/link";
import { Github, Zap, Shield, Code, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { EmailCapture } from "@/components/marketing/email-capture";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Multi-Agent AI Debate
          <br />
          <span className="text-primary">for Better Prompts</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Don't let Cursor guess. Tell it exactly what to build. Consilium orchestrates
          multiple AI models to debate and synthesize the perfect prompt for your coding AI.
        </p>
        <div className="mb-8">
          <EmailCapture />
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild size="lg" aria-label="Get started with Consilium">
            <Link href="/sign-up">
              <Sparkles className="mr-2 h-4 w-4" />
              Get Started
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" aria-label="View Consilium on GitHub">
            <Link href="https://github.com/yourusername/consilium" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <CardTitle>Input Your Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Describe what you want to build or the problem you're solving.
                This becomes the debate topic for multiple AI agents.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <CardTitle>Multi-Agent Debate</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Multiple AI models (GPT-4o, Claude, Gemini) debate your topic
                in parallel, critique each other, and refine their responses.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <CardTitle>Golden Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get a synthesized, optimized prompt ready to paste into Cursor,
                Copilot, or any AI coding tool. Better results, less debugging.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted py-20" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <h2 id="features-heading" className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
                <CardTitle>Open Source</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Fully open source. Self-host or contribute to the project on GitHub.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
                <CardTitle>Bring Your Own Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Use your own API keys for OpenAI, Anthropic, and Google AI.
                  Your keys, your costs, your control.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Code className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
                <CardTitle>Multi-Model Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Supports GPT-4o, Claude 3.5, Gemini, and more. Mix and match
                  models for the best results.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-Time Streaming</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Watch agents debate in real-time with Server-Sent Events streaming.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Export Golden Prompts as Markdown, .cursorrules files, or plain text.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Self-Hostable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Run Consilium on your own infrastructure with Docker Compose.
                  Full control over your data.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Try Demo / Self-Host */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Try the Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Experience Consilium without setting up anything. The demo instance
                uses our hosted API keys (with rate limits).
              </CardDescription>
              <Button asChild aria-label="Try the demo">
                <Link href="/sign-up">
                  Try Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Self-Host</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Run Consilium on your own infrastructure. Perfect for teams who want
                full control and privacy.
              </CardDescription>
              <Button asChild variant="outline" aria-label="View self-hosting guide">
                <Link href="https://github.com/yourusername/consilium#self-hosting" target="_blank" rel="noopener noreferrer">
                  View Setup Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* GitHub CTA */}
      <section className="bg-primary text-primary-foreground py-20" aria-labelledby="github-cta-heading">
        <div className="container mx-auto px-4 text-center">
          <Github className="h-12 w-12 mx-auto mb-4" aria-hidden="true" />
          <h2 id="github-cta-heading" className="text-3xl font-bold mb-4">Open Source & Free</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Consilium is open source and free to use. Star us on GitHub, contribute,
            or just use it for your projects.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="secondary" size="lg" aria-label="Star Consilium on GitHub">
              <Link href="https://github.com/yourusername/consilium" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                Star on GitHub
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" aria-label="Get started with Consilium">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">Consilium</h3>
              <p className="text-sm text-muted-foreground">
                Multi-agent AI debate platform for better prompts.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/sign-up" className="hover:text-foreground" aria-label="Get started">Get Started</Link></li>
                <li><Link href="/sign-in" className="hover:text-foreground" aria-label="Sign in">Sign In</Link></li>
                <li><Link href="https://github.com/yourusername/consilium" target="_blank" rel="noopener noreferrer" className="hover:text-foreground" aria-label="View on GitHub">GitHub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="https://github.com/yourusername/consilium#readme" target="_blank" rel="noopener noreferrer" className="hover:text-foreground" aria-label="View documentation">Documentation</Link></li>
                <li><Link href="https://github.com/yourusername/consilium#self-hosting" target="_blank" rel="noopener noreferrer" className="hover:text-foreground" aria-label="View self-hosting guide">Self-Hosting Guide</Link></li>
                <li><Link href="/faq" className="hover:text-foreground" aria-label="View FAQ">FAQ</Link></li>
                <li><Link href="https://github.com/yourusername/consilium/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="hover:text-foreground" aria-label="View contributing guide">Contributing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground" aria-label="Privacy policy">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground" aria-label="Terms of service">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Consilium. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
