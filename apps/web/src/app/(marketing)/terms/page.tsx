import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: January 10, 2026</p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using Consilium ("the Service"), you agree to be bound by these Terms 
              of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
            <p className="mb-4">
              Consilium is an open-source project released under the MIT License. These Terms apply 
              to the hosted version of the Service. Self-hosted instances are governed by the MIT 
              License and any additional terms you may establish.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Consilium is a multi-agent AI debate platform that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Orchestrates multiple AI models (GPT-4, Claude, Gemini) to debate topics</li>
              <li>Synthesizes recommendations from multi-model consensus</li>
              <li>Provides tools to export prompts for use with AI coding assistants</li>
              <li>Tracks usage and costs across AI providers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Account Registration</h2>
            <p className="mb-4">
              To use the Service, you must:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Be at least 13 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
            <p className="mb-4">
              You are responsible for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. API Keys and Bring Your Own Keys (BYOK)</h2>
            <p className="mb-4">
              The Service operates on a "Bring Your Own Keys" (BYOK) model:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>You are responsible for obtaining and maintaining valid API keys from AI providers</li>
              <li>You agree to comply with each AI provider's terms of service</li>
              <li>You are responsible for all costs incurred through your API keys</li>
              <li>We are not responsible for any charges, rate limits, or account issues with AI providers</li>
            </ul>
            <p className="mb-4">
              API keys stored in the Service are encrypted, but you acknowledge that storing keys 
              with any third-party service carries inherent risks.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="mb-4">
              You agree NOT to use the Service to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Generate content that is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Generate malware, exploit code, or content intended to harm systems or users</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Violate the terms of service of underlying AI providers</li>
              <li>Attempt to reverse engineer, hack, or compromise the Service</li>
              <li>Overload or disrupt the Service infrastructure</li>
              <li>Use automated tools to abuse the Service (except documented APIs)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. AI-Generated Content</h2>
            <p className="mb-4">
              You understand and agree that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>
                <strong>No Guarantees:</strong> AI-generated content may contain errors, inaccuracies, 
                or inappropriate material. The Service does not guarantee the accuracy, completeness, 
                or suitability of any generated content.
              </li>
              <li>
                <strong>Your Responsibility:</strong> You are solely responsible for reviewing, 
                verifying, and using any generated content. Always review code before execution.
              </li>
              <li>
                <strong>No Liability:</strong> We are not liable for any damages resulting from your 
                use of AI-generated content, including but not limited to bugs, security vulnerabilities, 
                or system failures.
              </li>
              <li>
                <strong>Ownership:</strong> You retain ownership of your input prompts. Ownership of 
                AI-generated outputs may be subject to the terms of the underlying AI providers.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="mb-4">
              <strong>Open Source:</strong> Consilium's source code is available under the MIT License. 
              You may use, modify, and distribute it according to that license.
            </p>
            <p className="mb-4">
              <strong>Trademarks:</strong> The Consilium name and logo are trademarks. You may not use 
              them without permission, except as allowed by law.
            </p>
            <p className="mb-4">
              <strong>Your Content:</strong> You retain all rights to your input content. By using the 
              Service, you grant us a limited license to process your content for the purpose of 
              providing the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Privacy</h2>
            <p className="mb-4">
              Your use of the Service is also governed by our Privacy Policy. By using the Service, 
              you consent to the collection and use of information as described in the Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Service Availability</h2>
            <p className="mb-4">
              We strive to maintain high availability but do not guarantee uninterrupted service. 
              The Service may be temporarily unavailable due to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Maintenance and updates</li>
              <li>Technical issues</li>
              <li>Third-party service outages (AI providers, hosting, etc.)</li>
              <li>Circumstances beyond our control</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Termination</h2>
            <p className="mb-4">
              We may suspend or terminate your access to the Service at any time, with or without 
              cause, with or without notice. You may also delete your account at any time.
            </p>
            <p className="mb-4">
              Upon termination, your right to use the Service ceases immediately. We may delete 
              your data as described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Disclaimer of Warranties</h2>
            <p className="mb-4 font-semibold">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>MERCHANTABILITY</li>
              <li>FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>NON-INFRINGEMENT</li>
              <li>ACCURACY OR RELIABILITY OF CONTENT</li>
            </ul>
            <p className="mb-4">
              We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CONSILIUM AND ITS CONTRIBUTORS SHALL NOT BE 
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
              INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Loss of profits, data, or goodwill</li>
              <li>Service interruption</li>
              <li>Computer damage or system failure</li>
              <li>Cost of substitute services</li>
            </ul>
            <p className="mb-4">
              This applies regardless of the legal theory and even if we have been advised of the 
              possibility of such damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless Consilium and its contributors from 
              any claims, liabilities, damages, costs, and expenses arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Content you generate or submit</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the 
              jurisdiction in which the project maintainers reside, without regard to conflict of 
              law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">15. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. Changes will be posted on this 
              page with an updated "Last updated" date. Your continued use of the Service after changes 
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">16. Severability</h2>
            <p className="mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions 
              will continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">17. Contact</h2>
            <p className="mb-4">
              For questions about these Terms:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Open an issue on our GitHub repository</li>
              <li>Email: legal@consiliumai.com (if applicable)</li>
            </ul>
          </section>

          <section className="mb-8 p-4 bg-muted rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Open Source License</h2>
            <p className="mb-4">
              Consilium is released under the MIT License:
            </p>
            <pre className="text-xs overflow-x-auto p-4 bg-background rounded">
{`MIT License

Copyright (c) 2026 Consilium Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
            </pre>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
