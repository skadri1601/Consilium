export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-12">Effective date: April 9, 2026</p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction &amp; Scope</h2>
              <p className="mb-4 text-muted-foreground">
                Consilium (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or the &quot;Platform&quot;) is an
                open-source AI deliberation platform operated by Saad Kadri as a sole proprietorship. This
                Privacy Policy describes how we collect, use, disclose, retain, and protect your personal
                information when you access or use the Consilium hosted service available at consilium.app (the
                &quot;Service&quot;), our APIs, our command-line interface, and any related websites or
                applications.
              </p>
              <p className="mb-4 text-muted-foreground">
                This policy applies to all users of the hosted Service worldwide. It does not apply to
                self-hosted instances of the Consilium open-source software, which are governed entirely by the
                operator of that instance. If you deploy Consilium on your own infrastructure, you assume full
                responsibility for compliance with all applicable data protection laws.
              </p>
              <p className="mb-4 text-muted-foreground">
                This policy is designed to comply with the European Union General Data Protection Regulation
                (GDPR), the UK General Data Protection Regulation (UK GDPR), the California Consumer Privacy Act
                as amended by the California Privacy Rights Act (CCPA/CPRA), the Virginia Consumer Data
                Protection Act (VCDPA), the Colorado Privacy Act (CPA), the Connecticut Data Privacy Act (CTDPA),
                the Utah Consumer Privacy Act (UCPA), the Texas Data Privacy and Security Act (TDPSA), the Oregon
                Consumer Privacy Act (OCPA), the Montana Consumer Data Privacy Act (MCDPA), India&apos;s Digital
                Personal Data Protection Act 2023 (DPDPA), China&apos;s Personal Information Protection Law
                (PIPL), Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA),
                Brazil&apos;s Lei Geral de Prote&ccedil;&atilde;o de Dados (LGPD), and Australia&apos;s Privacy
                Act 1988.
              </p>
              <p className="mb-4 text-muted-foreground">
                By using the Service, you acknowledge that you have read and understood this Privacy Policy. Where
                required by applicable law, we will obtain your explicit consent before processing your personal
                data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
              <p className="mb-4 text-muted-foreground">
                For the purposes of this Privacy Policy:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">&quot;Personal Data&quot;</strong> (also &quot;Personal
                  Information&quot;) means any information that identifies, relates to, describes, is reasonably
                  capable of being associated with, or could reasonably be linked, directly or indirectly, to an
                  identified or identifiable natural person. This includes &quot;personal data&quot; as defined
                  under GDPR, &quot;personal information&quot; under CCPA/CPRA, &quot;digital personal data&quot;
                  under DPDPA, and equivalent terms under other applicable laws.
                </li>
                <li>
                  <strong className="text-foreground">&quot;Processing&quot;</strong> means any operation or set
                  of operations performed on Personal Data, whether or not by automated means, including
                  collection, recording, organization, structuring, storage, adaptation, alteration, retrieval,
                  consultation, use, disclosure by transmission, dissemination, alignment, combination,
                  restriction, erasure, or destruction.
                </li>
                <li>
                  <strong className="text-foreground">&quot;Controller&quot;</strong> (also &quot;Data
                  Fiduciary&quot; under DPDPA, &quot;Business&quot; under CCPA) means the natural or legal person
                  that determines the purposes and means of the processing of Personal Data. For the hosted
                  Service, the Controller is Saad Kadri operating as Consilium.
                </li>
                <li>
                  <strong className="text-foreground">&quot;Processor&quot;</strong> (also &quot;Data
                  Processor&quot; under DPDPA, &quot;Service Provider&quot; under CCPA) means a natural or legal
                  person that processes Personal Data on behalf of the Controller.
                </li>
                <li>
                  <strong className="text-foreground">&quot;Data Subject&quot;</strong> (also &quot;Data
                  Principal&quot; under DPDPA, &quot;Consumer&quot; under CCPA) means the identified or
                  identifiable natural person to whom the Personal Data relates.
                </li>
                <li>
                  <strong className="text-foreground">&quot;Sensitive Personal Data&quot;</strong> means data
                  revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, trade
                  union membership, genetic data, biometric data, health data, or data concerning sex life or
                  sexual orientation, as well as any categories designated as sensitive under applicable law. We
                  do not intentionally collect Sensitive Personal Data.
                </li>
                <li>
                  <strong className="text-foreground">&quot;Third Party&quot;</strong> means a natural or legal
                  person, public authority, agency, or body other than the Data Subject, Controller, Processor, or
                  persons under the direct authority of the Controller or Processor.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>

              <h3 className="text-xl font-medium mb-2">3.1 Account Information</h3>
              <p className="mb-4 text-muted-foreground">
                When you create an account through our authentication provider (Clerk), we collect:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Email address (required for authentication)</li>
                <li>Name (optional, if provided through OAuth provider)</li>
                <li>Profile picture (optional, if provided through OAuth provider)</li>
                <li>OAuth provider identifiers (e.g., Google, GitHub account IDs)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">3.2 API Keys</h3>
              <p className="mb-4 text-muted-foreground">
                If you choose to store your AI provider API keys (OpenAI, Anthropic, Google AI, Groq, xAI) in
                our system, they are encrypted using AES-256-GCM encryption before storage. Your API keys are:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Encrypted at rest with AES-256-GCM industry-standard encryption</li>
                <li>Only decrypted in memory when needed to make API calls on your behalf</li>
                <li>Never logged, displayed in plain text, or shared with unauthorized third parties</li>
                <li>Transmitted only to the respective AI provider for which the key was issued</li>
                <li>Deletable at any time through your account settings</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">3.3 Debate Content</h3>
              <p className="mb-4 text-muted-foreground">
                When you use the deliberation features of the Service, we store:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Your debate topics, prompts, and configuration preferences</li>
                <li>AI agent responses generated during deliberation rounds</li>
                <li>Synthesized outputs, judgments, and consensus documents</li>
                <li>Deliberation mode selections and parameters</li>
                <li>Usage metrics including token counts, cost calculations, and timestamps</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">3.4 Payment Information</h3>
              <p className="mb-4 text-muted-foreground">
                Payment processing is handled entirely by Stripe. We do not store your full credit card number,
                CVV, or bank account details. We retain only:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Stripe customer ID</li>
                <li>Subscription status and plan type</li>
                <li>Last four digits of the payment method (for display purposes)</li>
                <li>Billing address (if provided)</li>
                <li>Transaction history and invoice records</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">3.5 Technical Information</h3>
              <p className="mb-4 text-muted-foreground">
                We automatically collect:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>IP address (for security, rate limiting, and approximate geolocation)</li>
                <li>Browser type, version, and language preference</li>
                <li>Operating system and device type</li>
                <li>Referring URL and pages visited within the Service</li>
                <li>Authentication events and timestamps (for security audit logs)</li>
                <li>Error reports and performance data (via Sentry)</li>
                <li>Feature usage and interaction patterns (via PostHog analytics)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">3.6 Cookies &amp; Similar Technologies</h3>
              <p className="mb-4 text-muted-foreground">
                We use cookies and similar tracking technologies as described in Section 6 of this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Legal Bases for Processing</h2>
              <p className="mb-4 text-muted-foreground">
                Under the GDPR, UK GDPR, and equivalent regulations, we process your Personal Data on the
                following legal bases:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Performance of a Contract (Art. 6(1)(b) GDPR):</strong>{" "}
                  Processing necessary to provide you with the Service, including account creation,
                  authentication, debate processing, and subscription management.
                </li>
                <li>
                  <strong className="text-foreground">Consent (Art. 6(1)(a) GDPR):</strong> Where you have given
                  explicit consent, such as for optional analytics tracking, marketing communications, or the
                  storage of API keys. You may withdraw consent at any time without affecting the lawfulness of
                  processing carried out prior to withdrawal.
                </li>
                <li>
                  <strong className="text-foreground">Legitimate Interests (Art. 6(1)(f) GDPR):</strong>{" "}
                  Processing necessary for our legitimate interests, provided those interests are not overridden
                  by your fundamental rights and freedoms. This includes security monitoring, fraud prevention,
                  service improvement, and bug fixing. We conduct balancing tests for each legitimate interest
                  claim.
                </li>
                <li>
                  <strong className="text-foreground">Legal Obligation (Art. 6(1)(c) GDPR):</strong> Processing
                  necessary to comply with a legal obligation to which we are subject, such as tax record
                  retention or responding to lawful government requests.
                </li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                For jurisdictions that do not use the legal bases framework (e.g., CCPA/CPRA), our collection and
                use of Personal Information is governed by the disclosures and rights described in the applicable
                sections of this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. How We Use Your Information</h2>
              <p className="mb-4 text-muted-foreground">
                We use your Personal Data for the following purposes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Service Delivery:</strong> To provide, operate, and
                  maintain the Consilium platform, including processing your debate requests through AI providers,
                  managing your account, and delivering deliberation results.
                </li>
                <li>
                  <strong className="text-foreground">Authentication &amp; Security:</strong> To verify your
                  identity, secure your account, detect and prevent fraudulent or unauthorized activity, enforce
                  rate limits, and maintain audit logs.
                </li>
                <li>
                  <strong className="text-foreground">Payment Processing:</strong> To process subscription
                  payments, manage billing, issue invoices and receipts, and handle refunds or disputes through
                  Stripe.
                </li>
                <li>
                  <strong className="text-foreground">Service Improvement:</strong> To analyze usage patterns,
                  diagnose technical issues, fix bugs, optimize performance, and develop new features.
                </li>
                <li>
                  <strong className="text-foreground">Analytics:</strong> To understand how users interact with
                  the Service, measure feature adoption, and improve user experience through aggregated and
                  anonymized analytics.
                </li>
                <li>
                  <strong className="text-foreground">Error Monitoring:</strong> To collect and analyze error
                  reports for debugging and reliability improvements through Sentry.
                </li>
                <li>
                  <strong className="text-foreground">Communications:</strong> To send you transactional emails
                  (e.g., account verification, password resets, subscription confirmations) and, with your
                  consent, product updates or marketing communications.
                </li>
                <li>
                  <strong className="text-foreground">Legal Compliance:</strong> To comply with applicable laws,
                  regulations, legal processes, or enforceable governmental requests.
                </li>
                <li>
                  <strong className="text-foreground">Abuse Prevention:</strong> To detect and prevent abuse of
                  the Service, including automated attacks, scraping, and terms of service violations.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Cookie Policy</h2>

              <h3 className="text-xl font-medium mb-2">6.1 What Cookies We Use</h3>
              <p className="mb-4 text-muted-foreground">
                We use the following categories of cookies and similar technologies:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Strictly Necessary Cookies:</strong> Required for the
                  Service to function. These include session cookies set by Clerk for authentication and CSRF
                  protection tokens. These cannot be disabled without breaking the Service.
                </li>
                <li>
                  <strong className="text-foreground">Analytics Cookies:</strong> Set by PostHog to help us
                  understand how users interact with the Service, including page views, feature usage, and
                  session duration. These are optional and can be opted out of.
                </li>
                <li>
                  <strong className="text-foreground">Performance Cookies:</strong> Set by Sentry for error
                  monitoring and performance tracking, including page load times and JavaScript errors.
                </li>
                <li>
                  <strong className="text-foreground">Payment Cookies:</strong> Set by Stripe for fraud
                  prevention and payment processing functionality.
                </li>
              </ul>

              <h3 className="text-xl font-medium mb-2">6.2 How to Manage Cookies</h3>
              <p className="mb-4 text-muted-foreground">
                You can control cookies through the following methods:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Browser settings: Most browsers allow you to block or delete cookies</li>
                <li>PostHog opt-out: You may opt out of PostHog analytics tracking through our cookie consent
                  banner or by contacting us</li>
                <li>Do Not Track: See Section 14 regarding Do Not Track signals</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                Disabling strictly necessary cookies may prevent you from using the Service. In accordance with
                the ePrivacy Directive (Directive 2002/58/EC as amended), we obtain consent before setting
                non-essential cookies for users in the EU/EEA and UK.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Data Sharing &amp; Third-Party Processors</h2>
              <p className="mb-4 text-muted-foreground">
                We do not sell, rent, or trade your Personal Data. We do not share your Personal Data for
                cross-context behavioral advertising. We share data only with the following categories of
                recipients, each acting as a data processor or sub-processor under appropriate data processing
                agreements:
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm text-muted-foreground border border-border">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-semibold text-foreground">Processor</th>
                      <th className="text-left p-3 font-semibold text-foreground">Purpose</th>
                      <th className="text-left p-3 font-semibold text-foreground">Data Shared</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Clerk</td>
                      <td className="p-3">Authentication &amp; identity management</td>
                      <td className="p-3">Email, name, profile picture, OAuth tokens, session data</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Stripe</td>
                      <td className="p-3">Payment processing &amp; subscription management</td>
                      <td className="p-3">Email, billing details, payment method, transaction data</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Sentry</td>
                      <td className="p-3">Error monitoring &amp; performance tracking</td>
                      <td className="p-3">IP address, browser info, error stack traces, user ID</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">PostHog</td>
                      <td className="p-3">Product analytics</td>
                      <td className="p-3">Anonymized usage events, session data, device info</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">OpenAI</td>
                      <td className="p-3">AI model provider for deliberations</td>
                      <td className="p-3">Debate prompts and content submitted by user</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Anthropic</td>
                      <td className="p-3">AI model provider for deliberations</td>
                      <td className="p-3">Debate prompts and content submitted by user</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Google AI</td>
                      <td className="p-3">AI model provider for deliberations</td>
                      <td className="p-3">Debate prompts and content submitted by user</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Groq</td>
                      <td className="p-3">AI model provider for deliberations</td>
                      <td className="p-3">Debate prompts and content submitted by user</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">xAI</td>
                      <td className="p-3">AI model provider for deliberations</td>
                      <td className="p-3">Debate prompts and content submitted by user</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Neon</td>
                      <td className="p-3">PostgreSQL database hosting</td>
                      <td className="p-3">All stored application data (encrypted at rest)</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Upstash</td>
                      <td className="p-3">Redis cache, queues, and session storage</td>
                      <td className="p-3">Session tokens, queue job data, cached values</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Vercel</td>
                      <td className="p-3">Web application hosting &amp; CDN</td>
                      <td className="p-3">IP address, request logs, static asset delivery</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium text-foreground">Render</td>
                      <td className="p-3">API &amp; agent backend hosting</td>
                      <td className="p-3">Application logs, request data</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mb-4 text-muted-foreground">
                <strong className="text-foreground">AI Provider Data Handling:</strong> When your debate content
                is sent to AI providers (OpenAI, Anthropic, Google AI, Groq, xAI), it is transmitted using your
                API keys or our platform keys. Each AI provider&apos;s handling of that data is governed by their
                own privacy policies and terms of service. We do not control and are not responsible for how AI
                providers process, store, or use the content once it is transmitted to them. We encourage you to
                review each provider&apos;s privacy policy independently.
              </p>
              <p className="mb-4 text-muted-foreground">
                We may also disclose your Personal Data if required to do so by law, regulation, legal process,
                or enforceable governmental request, or to protect the rights, property, or safety of Consilium,
                our users, or the public.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
              <p className="mb-4 text-muted-foreground">
                Our Service is operated from the United States. If you are accessing the Service from outside the
                United States, please be aware that your Personal Data will be transferred to, stored, and
                processed in the United States and potentially other countries where our processors operate.
              </p>
              <p className="mb-4 text-muted-foreground">
                For transfers of Personal Data from the European Economic Area (EEA), the United Kingdom, or
                Switzerland to countries that have not been deemed to provide an adequate level of data protection,
                we rely on:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Standard Contractual Clauses (SCCs):</strong> We enter into
                  the European Commission&apos;s Standard Contractual Clauses with our processors to ensure
                  adequate safeguards for transferred data, as approved under Commission Implementing Decision
                  (EU) 2021/914.
                </li>
                <li>
                  <strong className="text-foreground">UK International Data Transfer Agreement (IDTA):</strong>{" "}
                  For transfers from the UK, we use the UK IDTA or the UK Addendum to the EU SCCs as approved by
                  the UK Information Commissioner&apos;s Office.
                </li>
                <li>
                  <strong className="text-foreground">Adequacy Decisions:</strong> Where applicable, we rely on
                  adequacy decisions issued by the European Commission or the UK Secretary of State recognizing
                  certain countries as providing adequate data protection.
                </li>
                <li>
                  <strong className="text-foreground">Supplementary Measures:</strong> Where required by the
                  Schrems II decision (Case C-311/18), we implement supplementary technical, organizational, and
                  contractual measures to ensure the effectiveness of the transfer mechanism.
                </li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                For transfers involving data from China under PIPL, we comply with applicable cross-border
                transfer requirements including security assessments where mandated. For transfers from Brazil
                under LGPD, we use equivalent contractual safeguards. For transfers from India under DPDPA, we
                comply with any restrictions on cross-border transfers to countries notified by the Indian
                government.
              </p>
              <p className="mb-4 text-muted-foreground">
                You may request a copy of the applicable transfer safeguards by contacting us at the address in
                Section 18.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
              <p className="mb-4 text-muted-foreground">
                We retain your Personal Data only for as long as necessary to fulfill the purposes for which it
                was collected, or as required by applicable law. Our specific retention periods are:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Account Information:</strong> Retained for the duration of
                  your account. Deleted within 30 days of account deletion request, except where retention is
                  required by law.
                </li>
                <li>
                  <strong className="text-foreground">API Keys:</strong> Retained in encrypted form until you
                  delete them or delete your account. Purged from all systems within 30 days of deletion.
                </li>
                <li>
                  <strong className="text-foreground">Debate Content:</strong> Retained for the duration of your
                  account. You may delete individual debates at any time. All debate content is deleted within 30
                  days of account deletion.
                </li>
                <li>
                  <strong className="text-foreground">Payment Records:</strong> Retained for 7 years after the
                  transaction date as required by tax and financial regulations.
                </li>
                <li>
                  <strong className="text-foreground">Security &amp; Audit Logs:</strong> Retained for 12 months
                  for security investigation purposes, then automatically purged.
                </li>
                <li>
                  <strong className="text-foreground">Analytics Data:</strong> PostHog analytics data is retained
                  for 12 months, after which it is automatically deleted or anonymized.
                </li>
                <li>
                  <strong className="text-foreground">Error Reports:</strong> Sentry error data is retained for
                  90 days.
                </li>
                <li>
                  <strong className="text-foreground">Server Logs:</strong> Retained for 30 days, then
                  automatically deleted.
                </li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                When data is no longer required, it is securely deleted or irreversibly anonymized. Backup copies
                may persist for up to an additional 30 days before being purged from backup systems.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Your Rights by Jurisdiction</h2>
              <p className="mb-4 text-muted-foreground">
                Depending on your location and applicable law, you may have the following rights regarding your
                Personal Data. To exercise any of these rights, please contact us using the information in
                Section 18.
              </p>

              <h3 className="text-xl font-medium mb-2">10.1 European Economic Area, United Kingdom &amp; Switzerland (GDPR / UK GDPR)</h3>
              <p className="mb-4 text-muted-foreground">
                If you are located in the EEA, UK, or Switzerland, you have the following rights under GDPR and
                UK GDPR:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Right of Access (Art. 15):</strong> Obtain confirmation of whether we process your data and request a copy of it</li>
                <li><strong className="text-foreground">Right to Rectification (Art. 16):</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong className="text-foreground">Right to Erasure (Art. 17):</strong> Request deletion of your data (&quot;right to be forgotten&quot;), subject to legal exceptions</li>
                <li><strong className="text-foreground">Right to Restriction (Art. 18):</strong> Request restriction of processing in certain circumstances</li>
                <li><strong className="text-foreground">Right to Data Portability (Art. 20):</strong> Receive your data in a structured, commonly used, machine-readable format</li>
                <li><strong className="text-foreground">Right to Object (Art. 21):</strong> Object to processing based on legitimate interests, including profiling</li>
                <li><strong className="text-foreground">Rights Related to Automated Decision-Making (Art. 22):</strong> Not be subject to decisions based solely on automated processing that produce legal or similarly significant effects</li>
                <li><strong className="text-foreground">Right to Withdraw Consent (Art. 7(3)):</strong> Withdraw consent at any time where processing is based on consent</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                We will respond to your request within 30 days (extendable by an additional 60 days for complex
                requests). Requests are fulfilled free of charge unless manifestly unfounded or excessive.
              </p>

              <h3 className="text-xl font-medium mb-2">10.2 California (CCPA/CPRA)</h3>
              <p className="mb-4 text-muted-foreground">
                If you are a California resident, the California Consumer Privacy Act as amended by the California
                Privacy Rights Act grants you the following rights:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Right to Know:</strong> Request disclosure of the categories and specific pieces of Personal Information we have collected, the purposes of collection, and the categories of third parties with whom it is shared</li>
                <li><strong className="text-foreground">Right to Delete:</strong> Request deletion of your Personal Information, subject to legal exceptions</li>
                <li><strong className="text-foreground">Right to Correct:</strong> Request correction of inaccurate Personal Information</li>
                <li><strong className="text-foreground">Right to Opt-Out of Sale/Sharing:</strong> We do not sell your Personal Information or share it for cross-context behavioral advertising. If this changes, we will provide an opt-out mechanism</li>
                <li><strong className="text-foreground">Right to Limit Use of Sensitive Personal Information:</strong> We do not use or disclose Sensitive Personal Information for purposes beyond those permitted under CPRA</li>
                <li><strong className="text-foreground">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                We will respond to verifiable consumer requests within 45 days (extendable by an additional 45
                days). You may submit requests up to twice per 12-month period.
              </p>

              <h3 className="text-xl font-medium mb-2">10.3 Other U.S. States (VCDPA, CPA, CTDPA, UCPA, TDPSA, OCPA, MCDPA)</h3>
              <p className="mb-4 text-muted-foreground">
                If you reside in Virginia, Colorado, Connecticut, Utah, Texas, Oregon, or Montana, applicable
                state privacy laws grant you rights that may include:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Right to access your Personal Data</li>
                <li>Right to correct inaccuracies</li>
                <li>Right to delete your Personal Data</li>
                <li>Right to data portability</li>
                <li>Right to opt out of targeted advertising, sale of personal data, and profiling in furtherance of decisions that produce legal or similarly significant effects</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                Response timeframes and appeal procedures vary by state. If we deny your request, you may appeal
                by contacting us, and we will provide information about how to file a complaint with your
                state&apos;s attorney general if applicable.
              </p>

              <h3 className="text-xl font-medium mb-2">10.4 India (DPDPA 2023)</h3>
              <p className="mb-4 text-muted-foreground">
                If you are located in India, the Digital Personal Data Protection Act 2023 grants you the
                following rights as a Data Principal:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Right to Access:</strong> Obtain a summary of your digital personal data being processed and the processing activities</li>
                <li><strong className="text-foreground">Right to Correction and Erasure:</strong> Request correction of inaccurate or misleading data, completion of incomplete data, or erasure of data no longer necessary for the purpose for which it was collected</li>
                <li><strong className="text-foreground">Right to Grievance Redressal:</strong> Lodge complaints with us regarding processing of your data, to which we will respond within the timeframe prescribed by applicable rules</li>
                <li><strong className="text-foreground">Right to Nominate:</strong> Nominate another individual to exercise your rights in the event of your death or incapacity</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">10.5 China (PIPL)</h3>
              <p className="mb-4 text-muted-foreground">
                If you are located in the People&apos;s Republic of China, the Personal Information Protection Law
                grants you the following rights:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Right to Know and Decide:</strong> Be informed about and decide on the processing of your personal information, and restrict or refuse processing (except as required by law)</li>
                <li><strong className="text-foreground">Right to Access and Copy:</strong> Access and obtain copies of your personal information</li>
                <li><strong className="text-foreground">Right to Correction and Supplementation:</strong> Request correction or supplementation of inaccurate or incomplete information</li>
                <li><strong className="text-foreground">Right to Deletion:</strong> Request deletion of your personal information in prescribed circumstances</li>
                <li><strong className="text-foreground">Right to Portability:</strong> Request transfer of your personal information to another handler under conditions specified by the Cyberspace Administration of China</li>
                <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Withdraw consent at any time; withdrawal does not affect the lawfulness of processing conducted prior to withdrawal</li>
                <li><strong className="text-foreground">Right to Explanation:</strong> Request an explanation of the rules for processing your personal information</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">10.6 Canada (PIPEDA)</h3>
              <p className="mb-4 text-muted-foreground">
                If you are located in Canada, PIPEDA grants you the following rights:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Right to access your personal information held by us</li>
                <li>Right to challenge the accuracy and completeness of your personal information and have it amended</li>
                <li>Right to withdraw consent to the collection, use, or disclosure of your personal information, subject to legal or contractual restrictions</li>
                <li>Right to complain to the Office of the Privacy Commissioner of Canada</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">10.7 Brazil (LGPD)</h3>
              <p className="mb-4 text-muted-foreground">
                If you are located in Brazil, the Lei Geral de Prote&ccedil;&atilde;o de Dados grants you the
                following rights:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Confirmation of the existence of processing</li>
                <li>Access to your data</li>
                <li>Correction of incomplete, inaccurate, or outdated data</li>
                <li>Anonymization, blocking, or elimination of unnecessary or excessive data</li>
                <li>Portability of data to another service or product provider</li>
                <li>Deletion of personal data processed with your consent</li>
                <li>Information about public and private entities with which your data has been shared</li>
                <li>Information about the possibility of denying consent and the consequences thereof</li>
                <li>Revocation of consent</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">10.8 Australia (Privacy Act 1988)</h3>
              <p className="mb-4 text-muted-foreground">
                If you are located in Australia, the Privacy Act 1988 and the Australian Privacy Principles (APPs)
                grant you the following rights:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Right to access your personal information held by us (APP 12)</li>
                <li>Right to request correction of your personal information (APP 13)</li>
                <li>Right to complain about a breach of the APPs, and to have that complaint handled within a reasonable timeframe</li>
                <li>Right to complain to the Office of the Australian Information Commissioner (OAIC)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Children&apos;s Privacy</h2>
              <p className="mb-4 text-muted-foreground">
                The Service is not directed to children under the age of 16 (or the applicable age of digital
                consent in your jurisdiction). We do not knowingly collect Personal Data from children under 16.
                If you are a parent or guardian and believe your child has provided us with Personal Data, please
                contact us immediately.
              </p>
              <p className="mb-4 text-muted-foreground">
                In compliance with the U.S. Children&apos;s Online Privacy Protection Act (COPPA), we do not
                knowingly collect personal information from children under 13. In the EU/EEA, we comply with
                Article 8 of the GDPR regarding conditions applicable to a child&apos;s consent. In the UK, the
                applicable age is 13 under the UK GDPR. Under India&apos;s DPDPA, we do not process data of
                children (under 18) without verifiable parental consent.
              </p>
              <p className="mb-4 text-muted-foreground">
                If we discover that we have collected Personal Data from a child without appropriate consent, we
                will take steps to delete that data as quickly as possible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Security Measures</h2>
              <p className="mb-4 text-muted-foreground">
                We implement technical and organizational measures designed to protect your Personal Data against
                unauthorized access, alteration, disclosure, or destruction:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Encryption:</strong> All data is encrypted in transit using
                  TLS 1.2 or higher. Sensitive data (including API keys) is encrypted at rest using AES-256-GCM.
                  Database connections use encrypted channels.
                </li>
                <li>
                  <strong className="text-foreground">Access Controls:</strong> Access to production systems and
                  databases is restricted to authorized personnel using role-based access controls and
                  multi-factor authentication.
                </li>
                <li>
                  <strong className="text-foreground">Audit Logging:</strong> Security-relevant events including
                  authentication attempts, data access, and administrative actions are logged and monitored.
                </li>
                <li>
                  <strong className="text-foreground">Infrastructure Security:</strong> The Service is hosted on
                  platforms (Vercel, Render, Neon, Upstash) that maintain SOC 2 Type II certifications or
                  equivalent security standards.
                </li>
                <li>
                  <strong className="text-foreground">Dependency Management:</strong> Automated security scanning
                  of dependencies using GitHub CodeQL, pip-audit, Bandit, and Gitleaks for secret detection.
                </li>
                <li>
                  <strong className="text-foreground">Incident Response:</strong> We maintain an incident
                  response procedure for identifying, containing, and remediating security incidents, including
                  data breaches (see Section 16).
                </li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                While we implement commercially reasonable measures to protect your data, no method of electronic
                transmission or storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Self-Hosting &amp; Data Control</h2>
              <p className="mb-4 text-muted-foreground">
                Consilium is open-source software released under the MIT license and can be self-hosted on your
                own infrastructure. When you self-host Consilium:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>All data remains entirely on your own infrastructure under your sole control</li>
                <li>No data is sent to Consilium servers or any infrastructure operated by us</li>
                <li>You are the data controller and are solely responsible for compliance with all applicable
                  data protection and privacy laws in your jurisdiction</li>
                <li>You control all aspects of data collection, processing, retention, and deletion</li>
                <li>You are responsible for implementing appropriate security measures</li>
                <li>This Privacy Policy does not apply to self-hosted instances</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                <strong className="text-foreground">Limitation of Liability:</strong> We disclaim all
                responsibility and liability for data processing conducted on self-hosted instances of Consilium.
                The operator of a self-hosted instance bears full responsibility for data protection compliance,
                security, and any data breaches occurring on their infrastructure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Do Not Track Signals</h2>
              <p className="mb-4 text-muted-foreground">
                Some web browsers transmit &quot;Do Not Track&quot; (DNT) signals to websites. Because there is
                no universally accepted standard for how to respond to DNT signals, we currently do not alter our
                data collection and use practices in response to DNT signals. However, you can opt out of
                analytics tracking as described in Section 6 of this policy.
              </p>
              <p className="mb-4 text-muted-foreground">
                For California residents, we note that we do not engage in the &quot;sale&quot; or
                &quot;sharing&quot; (as those terms are defined under CCPA/CPRA) of your Personal Information,
                and we do not use or disclose Sensitive Personal Information for purposes that would require us to
                offer a right to limit under CPRA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">15. Automated Decision-Making</h2>
              <p className="mb-4 text-muted-foreground">
                The core functionality of Consilium involves the use of third-party AI models to process your
                debate prompts and generate responses. This AI processing is integral to the Service and is
                initiated at your direction.
              </p>
              <p className="mb-4 text-muted-foreground">
                We do not use automated decision-making or profiling, as defined under Article 22 of the GDPR,
                that produces legal or similarly significant effects on you. Specifically:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>We do not use automated systems to make decisions about your access to the Service, pricing, or terms</li>
                <li>We do not use profiling to evaluate personal aspects such as performance, economic situation, health, preferences, interests, reliability, behavior, or location</li>
                <li>AI-generated deliberation outputs are informational and do not constitute decisions with legal or similarly significant effects</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                Rate limiting and abuse detection systems make automated decisions about request throttling based
                on usage patterns, but these do not produce legal or similarly significant effects.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">16. Data Breach Notification</h2>
              <p className="mb-4 text-muted-foreground">
                In the event of a personal data breach that poses a risk to your rights and freedoms, we will:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">GDPR/UK GDPR:</strong> Notify the relevant supervisory
                  authority within 72 hours of becoming aware of the breach (Article 33). Where the breach is
                  likely to result in a high risk to your rights and freedoms, we will notify you without undue
                  delay (Article 34).
                </li>
                <li>
                  <strong className="text-foreground">CCPA/CPRA:</strong> Notify affected California residents
                  in the most expedient time possible and without unreasonable delay, consistent with the
                  legitimate needs of law enforcement and any measures necessary to determine the scope of the
                  breach.
                </li>
                <li>
                  <strong className="text-foreground">DPDPA (India):</strong> Notify the Data Protection Board
                  of India and affected Data Principals in the manner and timeframe prescribed by applicable
                  rules.
                </li>
                <li>
                  <strong className="text-foreground">PIPL (China):</strong> Immediately adopt remedial measures
                  and notify the relevant department performing personal information protection duties and
                  affected individuals.
                </li>
                <li>
                  <strong className="text-foreground">PIPEDA (Canada):</strong> Report to the Office of the
                  Privacy Commissioner of Canada and notify affected individuals as soon as feasible when the
                  breach creates a real risk of significant harm.
                </li>
                <li>
                  <strong className="text-foreground">LGPD (Brazil):</strong> Notify the Autoridade Nacional de
                  Prote&ccedil;&atilde;o de Dados (ANPD) and the data subject within a reasonable time period.
                </li>
                <li>
                  <strong className="text-foreground">Privacy Act 1988 (Australia):</strong> Notify the OAIC and
                  affected individuals as soon as practicable after becoming aware of an eligible data breach
                  under the Notifiable Data Breaches scheme.
                </li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                Breach notifications will include the nature of the breach, the categories and approximate number
                of records affected, the likely consequences, and the measures taken or proposed to address the
                breach.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">17. Changes to This Policy</h2>
              <p className="mb-4 text-muted-foreground">
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                technology, legal requirements, or for other operational reasons.
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>For material changes, we will notify you by email (using the email address associated with
                  your account) and/or by displaying a prominent notice within the Service at least 30 days
                  before the changes take effect.</li>
                <li>For non-material changes, we will update the &quot;Effective date&quot; at the top of this
                  policy.</li>
                <li>Where required by applicable law (e.g., GDPR), we will obtain your renewed consent for
                  material changes that affect the legal basis for processing.</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                Your continued use of the Service after the effective date of any changes constitutes your
                acceptance of the updated policy, to the extent permitted by applicable law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">18. Data Protection Contact</h2>
              <p className="mb-4 text-muted-foreground">
                Consilium is operated by Saad Kadri as a sole proprietorship. For all privacy-related inquiries,
                data subject access requests, complaints, or questions about this Privacy Policy, you may contact
                us at:
              </p>
              <ul className="list-none pl-0 mb-4 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Name:</strong> Saad Kadri</li>
                <li><strong className="text-foreground">Role:</strong> Data Protection Contact / Controller</li>
                <li>
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a
                    href="mailto:er.saadk16@gmail.com"
                    className="text-primary hover:underline"
                  >
                    er.saadk16@gmail.com
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">GitHub:</strong>{" "}
                  <a
                    href="https://github.com/skadri1601/Consilium"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    skadri1601/Consilium
                  </a>
                </li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                For GDPR purposes, Saad Kadri acts as the data controller. Given the current scale of operations,
                a formal Data Protection Officer (DPO) has not been appointed, as it is not required under Article
                37 of the GDPR. This will be reassessed as the organization grows.
              </p>
              <p className="mb-4 text-muted-foreground">
                We will acknowledge receipt of your inquiry within 5 business days and endeavor to respond
                substantively within the timeframes required by applicable law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">19. Complaint Rights &amp; Supervisory Authorities</h2>
              <p className="mb-4 text-muted-foreground">
                If you are unsatisfied with our response to your privacy concern, you have the right to lodge a
                complaint with the appropriate supervisory authority in your jurisdiction:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">EU/EEA:</strong> Your local Data Protection Authority
                  (DPA). A list of EEA DPAs is available at{" "}
                  <a
                    href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    edpb.europa.eu
                  </a>.
                </li>
                <li>
                  <strong className="text-foreground">United Kingdom:</strong> Information Commissioner&apos;s
                  Office (ICO) at{" "}
                  <a
                    href="https://ico.org.uk"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ico.org.uk
                  </a>.
                </li>
                <li>
                  <strong className="text-foreground">California:</strong> California Attorney General at{" "}
                  <a
                    href="https://oag.ca.gov/privacy"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    oag.ca.gov/privacy
                  </a>, or the California Privacy Protection Agency.
                </li>
                <li>
                  <strong className="text-foreground">Other U.S. States:</strong> Your state&apos;s Attorney
                  General office.
                </li>
                <li>
                  <strong className="text-foreground">India:</strong> The Data Protection Board of India, once
                  established and operational under the DPDPA 2023.
                </li>
                <li>
                  <strong className="text-foreground">China:</strong> The Cyberspace Administration of China or
                  the relevant department performing personal information protection duties.
                </li>
                <li>
                  <strong className="text-foreground">Canada:</strong> The Office of the Privacy Commissioner of
                  Canada at{" "}
                  <a
                    href="https://www.priv.gc.ca"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    priv.gc.ca
                  </a>.
                </li>
                <li>
                  <strong className="text-foreground">Brazil:</strong> The Autoridade Nacional de
                  Prote&ccedil;&atilde;o de Dados (ANPD).
                </li>
                <li>
                  <strong className="text-foreground">Australia:</strong> The Office of the Australian
                  Information Commissioner (OAIC) at{" "}
                  <a
                    href="https://www.oaic.gov.au"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    oaic.gov.au
                  </a>.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">20. Open-Source Contributors</h2>
              <p className="mb-4 text-muted-foreground">
                Consilium is open-source software. Contributors to the Consilium codebase via pull requests,
                issues, or other contributions on GitHub are not data processors or sub-processors under this
                Privacy Policy. Contributors do not have access to user data, production systems, or databases by
                virtue of their contributions. Any Personal Data visible in public GitHub contributions (e.g.,
                name, email in Git commits) is governed by GitHub&apos;s privacy policy and the
                contributor&apos;s own choices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">21. User Responsibilities &amp; Content</h2>
              <p className="mb-4 text-muted-foreground">
                You are solely responsible for the content you submit to the Service for deliberation, including
                debate prompts, topics, and any information contained therein. You represent and warrant that:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>You have the right to submit any content you provide to the Service</li>
                <li>Your content does not contain Personal Data of third parties unless you have a lawful basis
                  to process such data</li>
                <li>You will not submit Sensitive Personal Data, financial account credentials (other than AI
                  provider API keys), or other information requiring special regulatory protections unless you
                  understand and accept the risks</li>
                <li>You acknowledge that content submitted to the Service will be transmitted to third-party AI
                  providers for processing</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                We are not liable for any harm arising from content you choose to submit to the Service or from
                the outputs generated by AI providers in response to your content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">22. Third-Party Liability Limitation</h2>
              <p className="mb-4 text-muted-foreground">
                While we carefully select our processors and sub-processors, we are not responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">
                <li>Data breaches occurring at third-party processors (Clerk, Stripe, Sentry, PostHog, Neon,
                  Upstash, Vercel, Render, or AI providers) to the extent caused by their own failures</li>
                <li>Changes to third-party privacy policies or data handling practices</li>
                <li>AI provider training, retention, or processing of data beyond what is specified in their
                  terms of service and API agreements</li>
                <li>Data processing conducted by operators of self-hosted Consilium instances</li>
              </ul>
              <p className="mb-4 text-muted-foreground">
                We maintain data processing agreements with our processors where required by applicable law, and
                we conduct reasonable due diligence on our sub-processors. However, our liability for
                third-party actions is limited to the extent permitted by applicable law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">23. Effective Date</h2>
              <p className="mb-4 text-muted-foreground">
                This Privacy Policy is effective as of April 9, 2026, and supersedes all prior versions.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
