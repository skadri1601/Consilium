# Getting Started with Consilium

Welcome to Consilium! This guide will help you get started with creating your first multi-agent AI debate.

## What is Consilium?

Consilium is a platform that orchestrates multiple AI models (GPT-4o, Claude, Gemini) to debate and synthesize the perfect prompt for your coding AI assistant. Instead of relying on a single model's output, multiple agents debate your topic, critique each other, and create a refined "Golden Prompt" that produces better results.

## Quick Start

### 1. Sign Up

1. Visit the [Consilium homepage](https://consiliumai.com)
2. Click "Get Started" or "Sign Up"
3. Sign in with Google, GitHub, or email

### 2. Configure API Keys (Optional)

Consilium supports "Bring Your Own Keys" (BYOK). You can use your own API keys for OpenAI, Anthropic, and Google AI:

1. Go to **Settings** → **API Keys**
2. Enter your API keys for the providers you want to use
3. Click "Test Connection" to verify each key
4. Click "Save"

**Note:** If you don't provide API keys, Consilium will use demo keys with rate limits.

### 3. Start Your First Debate

1. Navigate to **Council** from the sidebar
2. Select one or more AI agents (models) from the agent selector
3. Enter your topic in the text area:
   ```
   Build a REST API with authentication using Node.js, Express, and PostgreSQL. 
   Include user registration, login, JWT tokens, and protected routes.
   ```
4. Click "Start Debate" or press `Cmd/Ctrl + Enter`

### 4. Watch the Debate

- Agents will respond in parallel during Round 1
- Each agent critiques others' responses
- Agents refine their responses in Round 2
- A Golden Prompt is synthesized from the consensus

### 5. Use the Golden Prompt

Once the debate completes, you'll see the Golden Prompt:

- **Copy to Clipboard**: Click the copy button or press `Cmd/Ctrl + C`
- **Export as .cursorrules**: Download as a `.cursorrules` file for Cursor
- **Export as Markdown**: Download as a Markdown file

Paste the Golden Prompt into your AI coding assistant (Cursor, Copilot, etc.) for better results!

## Understanding the Debate Process

### Round 1: Initial Responses
All selected agents respond to your topic in parallel. Each agent provides its own perspective and approach.

### Critique Phase
Each agent reviews the other agents' responses and provides critiques, identifying strengths and weaknesses.

### Round 2: Refinement
Agents refine their responses based on the critiques, incorporating insights from other agents.

### Synthesis
A final "Golden Prompt" is synthesized that combines the best elements from all agents' responses.

## Tips for Better Results

1. **Be Specific**: Include details about:
   - Tech stack (Node.js, Python, React, etc.)
   - Features you want
   - Requirements and constraints
   - Target audience

2. **Select Multiple Agents**: Using 3+ agents creates richer debates and better synthesis

3. **Review the Golden Prompt**: The synthesized prompt is optimized, but you can still refine it manually

4. **Experiment**: Try different combinations of agents to see which work best for your use case

## Keyboard Shortcuts

- `Cmd/Ctrl + K`: Focus debate input
- `Cmd/Ctrl + Enter`: Submit debate
- `Cmd/Ctrl + C`: Copy Golden Prompt (when visible)
- `Esc`: Close modals/dialogs

## Next Steps

- Read the [FAQ](./faq.md) for common questions
- Check out [Export Formats](./export-formats.md) for details on using Golden Prompts
- Explore [Advanced Features](./advanced-features.md) for power users

## Need Help?

- Visit the [FAQ](./faq.md)
- Open an issue on [GitHub](https://github.com/yourusername/consilium)
- Check the [API Documentation](../apps/api/README.md) for developers

