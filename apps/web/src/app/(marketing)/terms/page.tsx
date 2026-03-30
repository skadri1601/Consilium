export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-12">Last updated: January 10, 2026</p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4 text-muted-foreground">
                By accessing or using Consilium, you agree to be bound by these Terms of Service.
                If you do not agree, do not use the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="mb-4 text-muted-foreground">
                Consilium is an open-source platform that orchestrates multi-agent AI debates
                to generate optimized prompts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. API Keys (BYOK)</h2>
              <p className="mb-4 text-muted-foreground">
                You are responsible for obtaining and maintaining valid API keys from AI providers,
                complying with their terms, and all costs incurred through your keys.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="mb-4 text-muted-foreground">You agree NOT to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Generate illegal, harmful, or abusive content</li>
                <li>Violate AI provider terms of service</li>
                <li>Attempt to hack or compromise the service</li>
                <li>Overload or disrupt the infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. AI-Generated Content</h2>
              <p className="mb-4 text-muted-foreground">
                AI-generated content may contain errors. You are solely responsible for
                reviewing and verifying any generated content before use.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Open Source License</h2>
              <p className="mb-4 text-muted-foreground">
                Consilium is released under the MIT License. You may use, modify, and distribute
                it according to that license.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Disclaimer</h2>
              <p className="mb-4 text-muted-foreground">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. We do not
                guarantee accuracy, reliability, or availability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="mb-4 text-muted-foreground">
                We shall not be liable for any indirect, incidental, or consequential damages
                arising from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
              <p className="mb-4 text-muted-foreground">
                For questions about these terms, open an issue on our{" "}
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
