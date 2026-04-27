# Frequently Asked Questions

## General

### What is a Golden Prompt?

A Golden Prompt is a synthesized, optimized prompt created by multiple AI agents debating your topic. It combines the best insights from different models into a single, refined prompt that produces better results when used with AI coding assistants.

### How does multi-model debate work?

1. You provide a topic or problem description
2. Multiple AI models (GPT-4o, Claude, Gemini) respond in parallel
3. Each model critiques the others' responses
4. Models refine their responses based on critiques
5. A final Golden Prompt is synthesized from the consensus

### Why use multiple models instead of one?

Different AI models have different strengths:
- Some are better at architecture and planning
- Others excel at edge cases and error handling
- Some provide more creative solutions

By having them debate, you get the best of all worlds in a single, refined prompt.

## API Keys

### Do I need to provide my own API keys?

No, but it's recommended. Consilium supports "Bring Your Own Keys" (BYOK):
- **With your keys**: Full control, no rate limits, you pay directly to providers
- **Without keys**: Uses demo keys with rate limits (for testing only)

### How are my API keys stored?

API keys are encrypted using AES-256-GCM encryption before being stored in the database. They are never logged, displayed in plain text, or shared with third parties (except the respective AI providers when processing requests).

### Can I use multiple providers?

Yes! You can configure keys for OpenAI, Anthropic, and Google AI simultaneously. This allows you to use models from all providers in your debates.

### How do I test my API keys?

Go to **Settings** → **API Keys** and click "Test Connection" next to each provider. This will verify that your key is valid and has the necessary permissions.

## Usage

### How many debates can I run?

There are no hard limits on the number of debates you can run. However, each debate consumes API tokens, so costs depend on:
- Number of agents selected
- Length of your topic
- Complexity of the debate

### How long does a debate take?

- **Single agent**: 5-10 seconds
- **3 agents (budget models)**: 20-30 seconds
- **3 agents (premium models)**: 30-45 seconds
- **5 agents**: 45-60 seconds

Times vary based on model response times and API latency.

### Can I cancel a debate in progress?

Currently, debates cannot be cancelled once started. They will complete or fail on their own. This is a feature we're working on.

### What happens if a debate fails?

If a debate fails (e.g., API error, rate limit), you'll see an error message. The debate will be marked as "failed" in your history. You can try again with different agents or check your API keys.

## Export Formats

### What is a .cursorrules file?

A `.cursorrules` file is used by Cursor (the AI code editor) to provide context and instructions. Consilium can export Golden Prompts in this format for direct use with Cursor.

### How do I use the Golden Prompt with Cursor?

1. Export the Golden Prompt as `.cursorrules`
2. Place the file in your project root directory
3. Cursor will automatically use it for context

### Can I use Golden Prompts with other tools?

Yes! Golden Prompts work with:
- **Cursor**: Use `.cursorrules` format
- **GitHub Copilot**: Copy and paste the prompt
- **ChatGPT/Claude**: Use as a system prompt or in conversation
- **Any AI coding assistant**: The prompt is optimized for clarity and completeness

## Self-Hosting

### Can I self-host Consilium?

Yes! Consilium is open source and can be self-hosted. See the [Self-Hosting Guide](./self-hosting.md) for instructions.

### What are the requirements for self-hosting?

- Docker and Docker Compose
- PostgreSQL database (or Neon)
- Redis (or Upstash)
- API keys for AI providers
- At least 2GB RAM, 2 CPU cores

### Is self-hosting free?

Yes, Consilium is open source under the MIT License. You only pay for:
- Infrastructure (hosting, database, Redis)
- AI provider API costs (when you make requests)

## Technical

### What models are supported?

**OpenAI:**
- GPT-4o
- GPT-4o-mini

**Anthropic:**
- Claude 3.5 Sonnet
- Claude 3.5 Haiku

**Google AI:**
- Gemini 2.0 Flash
- Gemini 1.5 Pro

### How are costs calculated?

Costs are calculated based on:
- Tokens used (input + output)
- Model pricing per token
- Number of agents and rounds

You can see the cost breakdown for each debate in the debate details.

### Is my data private?

Yes! When self-hosting, all data stays on your infrastructure. For the hosted version:
- Your prompts are stored in the database
- API keys are encrypted
- Data is not shared with third parties (except AI providers for processing)
- See our [Privacy Policy](../apps/web/src/app/(marketing)/privacy/page.tsx) for details

## Troubleshooting

### Debate is stuck on "processing"

This can happen if:
- The AI workers service is down
- There's a network issue
- An API key is invalid

Try:
1. Check your API keys in Settings
2. Refresh the page
3. Start a new debate

### "No API keys configured" error

You need at least one API key configured. Go to **Settings** → **API Keys** and add keys for OpenAI, Anthropic, or Google AI.

### Golden Prompt is empty

This usually means the debate failed during synthesis. Check:
1. Your API keys are valid
2. You have sufficient API credits
3. Try with different agents

### Can't connect to AI workers

If you're self-hosting, ensure:
1. The AI workers service is running
2. The `AI_WORKERS_URL` environment variable is set correctly
3. Network connectivity between services

## Support

### Where can I get help?

- **Documentation**: Check these docs and the [README](../README.md)
- **GitHub Issues**: Report bugs or ask questions on [GitHub](https://github.com/skadri1601/Consilium)
- **Community**: Join discussions on GitHub Discussions

### How do I report a bug?

1. Open an issue on GitHub
2. Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information
   - Error messages (if any)

### Can I contribute?

Yes! Consilium is open source. See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

