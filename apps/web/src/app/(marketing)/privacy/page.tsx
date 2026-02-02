import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: January 10, 2026</p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Consilium ("we", "our", or "us") is an open-source AI debate platform that orchestrates 
              multiple AI models to generate optimized prompts. This Privacy Policy explains how we 
              collect, use, and protect your information when you use our service.
            </p>
            <p className="mb-4">
              Consilium is designed with privacy in mind and supports self-hosting, giving you complete 
              control over your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mb-2">2.1 Account Information</h3>
            <p className="mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Email address (required for authentication)</li>
              <li>Name (optional, if provided through OAuth)</li>
              <li>Profile picture (optional, if provided through OAuth)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.2 API Keys</h3>
            <p className="mb-4">
              If you choose to store your AI provider API keys (OpenAI, Anthropic, Google AI) in our 
              system, they are encrypted using AES-256-GCM encryption before storage. Keys are:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Encrypted at rest with industry-standard encryption</li>
              <li>Only decrypted when needed to make API calls on your behalf</li>
              <li>Never logged, displayed in plain text, or shared with third parties</li>
              <li>Transmitted only to the respective AI providers (OpenAI, Anthropic, Google)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.3 Debate Content</h3>
            <p className="mb-4">
              We store:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Your debate topics and prompts</li>
              <li>AI agent responses during debates</li>
              <li>Generated synthesis</li>
              <li>Usage metrics (token counts, costs, timestamps)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.4 Technical Information</h3>
            <p className="mb-4">
              We automatically collect:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>IP address (for security and rate limiting)</li>
              <li>Browser type and version</li>
              <li>Authentication events (for security audit logs)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Provide and maintain the Consilium service</li>
              <li>Authenticate your identity and secure your account</li>
              <li>Process your debate requests through AI providers</li>
              <li>Display your debate history and analytics</li>
              <li>Improve our service and fix bugs</li>
              <li>Detect and prevent abuse or security threats</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Data Sharing</h2>
            <p className="mb-4">
              We do not sell your personal information. We share data only in these cases:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>
                <strong>AI Providers:</strong> Your prompts are sent to OpenAI, Anthropic, or Google 
                AI to process debate requests. Review their privacy policies for how they handle data.
              </li>
              <li>
                <strong>Authentication Provider:</strong> We use Clerk for authentication. See Clerk's 
                privacy policy at clerk.com/privacy.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information if required by law 
                or to protect our rights.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
            <p className="mb-4">
              We retain your data for as long as your account is active. You can:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Delete individual debates at any time</li>
              <li>Remove your stored API keys at any time</li>
              <li>Request complete account deletion by contacting us</li>
            </ul>
            <p className="mb-4">
              When you delete your account, all associated data is permanently removed within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Self-Hosting</h2>
            <p className="mb-4">
              Consilium is open source and can be self-hosted. When you self-host:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>All data remains on your own infrastructure</li>
              <li>No data is sent to Consilium servers</li>
              <li>You are responsible for your own data security and compliance</li>
              <li>You control all aspects of data retention and processing</li>
            </ul>
            <p className="mb-4">
              Self-hosting documentation is available in our GitHub repository.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>HTTPS encryption for all data in transit</li>
              <li>AES-256-GCM encryption for API keys at rest</li>
              <li>Secure session management with automatic expiration</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Audit logging for security events</li>
              <li>Regular security updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Your Rights (GDPR/CCPA)</h2>
            <p className="mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of data processing</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, contact us via GitHub issues or email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Cookies</h2>
            <p className="mb-4">
              We use essential cookies for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Authentication and session management (via Clerk)</li>
              <li>Security (CSRF protection)</li>
            </ul>
            <p className="mb-4">
              We do not use tracking or advertising cookies. Analytics, if enabled, use 
              privacy-respecting alternatives like Plausible or Vercel Analytics.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="mb-4">
              Consilium is not intended for users under 13 years of age. We do not knowingly 
              collect information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. Changes will be posted on this 
              page with an updated "Last updated" date. Significant changes will be communicated 
              via email or in-app notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
            <p className="mb-4">
              For privacy-related questions or concerns:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Open an issue on our GitHub repository</li>
              <li>Email: privacy@consiliumai.com (if applicable)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Third-Party Services</h2>
            <p className="mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>OpenAI</strong> - AI processing (openai.com/privacy)</li>
              <li><strong>Anthropic</strong> - AI processing (anthropic.com/privacy)</li>
              <li><strong>Google AI</strong> - AI processing (ai.google/privacy)</li>
              <li><strong>Clerk</strong> - Authentication (clerk.com/privacy)</li>
              <li><strong>Vercel</strong> - Hosting (vercel.com/privacy)</li>
              <li><strong>Sentry</strong> - Error monitoring (sentry.io/privacy)</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
