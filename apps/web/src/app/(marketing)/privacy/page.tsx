export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-12">Last updated: January 10, 2026</p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4 text-muted-foreground">
                Consilium (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is an open-source AI debate platform that orchestrates
                multiple AI models to generate optimized prompts. This Privacy Policy explains how we
                collect, use, and protect your information when you use our service.
              </p>
              <p className="mb-4 text-muted-foreground">
                Consilium is designed with privacy in mind and supports self-hosting, giving you complete
                control over your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium mb-2">2.1 Account Information</h3>
              <p className="mb-4 text-muted-foreground">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Email address (required for authentication)</li>
                <li>Name (optional, if provided through OAuth)</li>
                <li>Profile picture (optional, if provided through OAuth)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">2.2 API Keys</h3>
              <p className="mb-4 text-muted-foreground">
                If you choose to store your AI provider API keys (OpenAI, Anthropic, Google AI) in our
                system, they are encrypted using AES-256-GCM encryption before storage. Keys are:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Encrypted at rest with industry-standard encryption</li>
                <li>Only decrypted when needed to make API calls on your behalf</li>
                <li>Never logged, displayed in plain text, or shared with third parties</li>
                <li>Transmitted only to the respective AI providers (OpenAI, Anthropic, Google)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">2.3 Debate Content</h3>
              <p className="mb-4 text-muted-foreground">We store:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Your debate topics and prompts</li>
                <li>AI agent responses during debates</li>
                <li>Generated synthesis</li>
                <li>Usage metrics (token counts, costs, timestamps)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">2.4 Technical Information</h3>
              <p className="mb-4 text-muted-foreground">We automatically collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>IP address (for security and rate limiting)</li>
                <li>Browser type and version</li>
                <li>Authentication events (for security audit logs)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="mb-4 text-muted-foreground">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Provide and maintain the Consilium service</li>
                <li>Authenticate your identity and secure your account</li>
                <li>Process your debate requests through AI providers</li>
                <li>Display your debate history and analytics</li>
                <li>Improve our service and fix bugs</li>
                <li>Detect and prevent abuse or security threats</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
              <p className="mb-4 text-muted-foreground">
                We do not sell your personal information. We share data only in these cases:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">AI Providers:</strong> Your prompts are sent to OpenAI, Anthropic, or Google
                  AI to process debate requests. Review their privacy policies for how they handle data.
                </li>
                <li>
                  <strong className="text-foreground">Authentication Provider:</strong> We use Clerk for authentication. See Clerk&apos;s
                  privacy policy at clerk.com/privacy.
                </li>
                <li>
                  <strong className="text-foreground">Legal Requirements:</strong> We may disclose information if required by law
                  or to protect our rights.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Self-Hosting</h2>
              <p className="mb-4 text-muted-foreground">
                Consilium is open source and can be self-hosted. When you self-host:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>All data remains on your own infrastructure</li>
                <li>No data is sent to Consilium servers</li>
                <li>You are responsible for your own data security and compliance</li>
                <li>You control all aspects of data retention and processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p className="mb-4 text-muted-foreground">
                For privacy-related questions, open an issue on our{" "}
                <a
                  href="https://github.com/skadri1601/"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub repository
                </a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
