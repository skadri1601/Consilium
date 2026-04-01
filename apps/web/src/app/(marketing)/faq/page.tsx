import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Frequently Asked Questions
          </h1>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need to know about Consilium
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is">
              <AccordionTrigger>What is Consilium?</AccordionTrigger>
              <AccordionContent>
                Consilium is an open-source platform that runs multiple models in debate
                and synthesizes a single prompt you can use in Cursor, Copilot, or your editor.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="self-host">
              <AccordionTrigger>How do I self-host Consilium?</AccordionTrigger>
              <AccordionContent>
                See our{" "}
                <a
                  href="https://github.com/skadri1601/#self-hosting"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  self-hosting guide
                </a>
                . You&apos;ll need Docker Compose, PostgreSQL, Redis, and API keys from providers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api-keys">
              <AccordionTrigger>Do I need API keys?</AccordionTrigger>
              <AccordionContent>
                Yes. Consilium uses a &quot;Bring Your Own Keys&quot; (BYOK) model. You provide your
                own API keys for OpenAI, Anthropic, Google, XAI, and/or Groq. Keys are encrypted
                before storage.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cost">
              <AccordionTrigger>How much does it cost?</AccordionTrigger>
              <AccordionContent>
                Consilium itself is free and open source. You only pay for the API calls
                you make through your own API keys. Costs vary by provider and model.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="models">
              <AccordionTrigger>Which models are supported?</AccordionTrigger>
              <AccordionContent>
                Supports the latest models including Claude Opus 4.6, Claude Sonnet 4.5, Claude Haiku 4.5,
                GPT-4o, GPT-o1, Gemini 2.0 Flash, Gemini 1.5 Pro, Grok (XAI), and Groq models.
                More models can be added by the community.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="export">
              <AccordionTrigger>What export formats are available?</AccordionTrigger>
              <AccordionContent>
                You can export synthesis as Markdown, .cursorrules files, or plain text.
                Copy to clipboard is also available.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
