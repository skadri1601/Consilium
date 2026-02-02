import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

export default function FAQPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
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
                  href="https://github.com/yourusername/consilium#self-hosting"
                  className="text-primary hover:underline"
                >
                  self-hosting guide
                </a>
                . You'll need Docker Compose, PostgreSQL, Redis, and API keys from providers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api-keys">
              <AccordionTrigger>Do I need API keys?</AccordionTrigger>
              <AccordionContent>
                Yes. Consilium uses a "Bring Your Own Keys" (BYOK) model. You provide your
                own API keys for OpenAI, Anthropic, and/or Google. Keys are encrypted
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
                Currently supported: GPT-4o, GPT-4o-mini, Claude 3.5 Opus, Claude 3.5 Haiku,
                Gemini 2.0 Flash, and Gemini 1.5 Pro. More models can be added by the community.
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
        </CardContent>
      </Card>
    </div>
  );
}

