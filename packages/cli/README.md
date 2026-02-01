# @consilium/cli

> CLI for Consilium AI Council - Multi-agent debate platform

Stop coding blindly. Let multiple AI models debate the best approach before you write a single line of code.

## Like Gemini CLI / Cursor CLI

Consilium CLI works the same way you use Gemini or Cursor in the terminal:

| Action | Command |
|--------|---------|
| **Interactive session** (default) | `consilium` |
| **One-shot question** | `consilium "Build a chat feature"` |
| **Explicit debate** | `consilium debate "Your topic"` |
| **Resume saved session** | `consilium sessions resume <id>` |

```bash
# Drop into interactive multi-agent chat (like gemini chat / cursor)
consilium

# Ask one question and exit (like cursor ask "..." )
consilium "How should I implement auth?"

# Classic debate with options
consilium debate "Design API" --models gpt-4o-mini claude-haiku --output plan.md
```

In the REPL you get a simple `> ` prompt. Type a topic to start a debate, or use:

- **`/ask <topic>`** – Run one debate (same as typing the topic)
- **`/help`** – List all commands
- **↑/↓** – Input history (previous topics and commands)
- **`/exit`** – Save session and quit

Streaming output shows each agent’s turn clearly (▶ model, streamed text, ✓ done) and a Golden Prompt section at the end.

## Features

- 🤖 **Multi-Agent Debates** - GPT-4, Claude, Gemini, and more debate your problem
- ⚡ **Real-Time Streaming** - Watch AI responses as they happen
- 📝 **Golden Prompt** - Get a synthesized "best approach" from all perspectives
- 🔧 **Configurable** - BYOK (Bring Your Own Keys) - no markup, full privacy
- 🎨 **Beautiful Output** - Colored, formatted terminal output

## Installation

### Global Installation

```bash
npm install -g @consilium/cli
```

### Use with npx (No Installation)

```bash
npx @consilium/cli "your question"
```

## Quick Start

```bash
# Interactive session (default)
consilium

# One-shot question
consilium "Build a real-time chat feature"

# Explicit debate with options
consilium debate "Optimize database queries" --models gpt-4o-mini claude-haiku

# Save output to file
consilium debate "Design user authentication" --output plan.md
```

## Usage

### Debate Command

Start a multi-agent debate on any topic:

```bash
consilium debate "<your question>"
```

**Options:**
- `-m, --models <models...>` - Specify which AI models to use
  - Available: `gpt-4o-mini`, `claude-haiku`, `gemini-flash`, `groq-llama`
- `-o, --output <file>` - Save the golden prompt to a file

**Examples:**

```bash
# Basic debate
consilium debate "How should I implement caching?"

# Use specific models
consilium debate "Build a payment system" \
  --models gpt-4o-mini claude-haiku gemini-flash

# Save to file
consilium debate "Design API architecture" --output api-plan.md
```

### Config Command

Manage CLI configuration:

```bash
# Set configuration values
consilium config set <key> <value>

# Get a configuration value
consilium config get <key>

# List all configuration
consilium config list
```

**Configuration Keys:**
- `apiUrl` - Consilium API endpoint (default: `http://localhost:4000`)
- `apiKey` - Your Consilium API key (optional, for authenticated access)

**Examples:**

```bash
# Set API URL
consilium config set apiUrl "https://api.consilium.dev"

# Set API key
consilium config set apiKey "your-api-key-here"

# View all config
consilium config list
```

## Configuration File

Configuration is stored in `~/.consilium/config.json`:

```json
{
  "apiUrl": "http://localhost:4000",
  "apiKey": "your-api-key"
}
```

You can also set the API URL via environment variable:

```bash
export CONSILIUM_API_URL="http://localhost:4000"
```

## Development Workflow

### 1. Plan Your Feature

```bash
consilium debate "Implement user authentication with JWT" > auth-plan.md
```

### 2. Review the Golden Prompt

The CLI will show you:
- Individual agent responses (what each AI thinks)
- A synthesized "Golden Prompt" (the best combined approach)

### 3. Code with Confidence

Use the golden prompt as your implementation guide:

```bash
cursor auth-plan.md
# Or: code auth-plan.md
# Or: vim auth-plan.md
```

## Why Use the CLI?

### Before Consilium CLI:
1. Ask ChatGPT for help → Get one perspective
2. Start coding → Realize there's a better approach
3. Refactor → Waste hours

### With Consilium CLI:
1. `consilium debate "your problem"`
2. Get multiple AI perspectives + synthesized best approach
3. Code once, correctly

## Use Cases

### Planning New Features
```bash
consilium debate "Add real-time notifications to my app" > notifications-plan.md
```

### Debugging Architecture Decisions
```bash
consilium debate "Should I use WebSockets or Server-Sent Events?"
```

### Optimizing Performance
```bash
consilium debate "How can I reduce database query time by 50%?"
```

### Learning Best Practices
```bash
consilium debate "What's the best way to handle errors in async JavaScript?"
```

## Requirements

- Node.js >= 20.0.0
- A running Consilium backend (or access to hosted instance)

## Self-Hosting

To run your own Consilium backend:

```bash
git clone https://github.com/yourusername/consilium
cd consilium
docker-compose up
```

Then configure the CLI:

```bash
consilium config set apiUrl "http://localhost:4000"
```

## Troubleshooting

### Connection Refused

```
Error: ECONNREFUSED
```

**Solution:** Make sure the Consilium backend is running:
```bash
docker-compose up
```

### Authentication Failed

```
Error: 401 Unauthorized
```

**Solution:** Set your API key:
```bash
consilium config set apiKey "your-key"
```

### Command Not Found

```
consilium: command not found
```

**Solution:** Either install globally or use npx:
```bash
npm install -g @consilium/cli
# Or use: npx @consilium/cli debate "..."
```

## Example Output

```
$ consilium debate "Build a todo app"

✔ Debate created!

🤖 Agents Debating:

[GPT-4o-mini] Thinking...
For a todo app, I'd recommend using React with local storage...
✓ Done

[Claude Haiku] Thinking...
Consider using a state management solution like Zustand...
✓ Done

[Gemini Flash] Thinking...
Start with a simple component structure: TodoList, TodoItem...
✓ Done

📝 Golden Prompt:

Build a React todo app with the following architecture:
1. Use React hooks (useState, useEffect) for state
2. Implement local storage persistence
3. Add Zustand for state management (scalable approach)
4. Component structure: App > TodoList > TodoItem
5. Features: Add, delete, toggle completion, filter

✓ Debate complete!
```

## License

MIT License - Feel free to use commercially, fork, or build on top of it.

## Links

- **GitHub**: [https://github.com/yourusername/consilium](https://github.com/yourusername/consilium)
- **Documentation**: [https://docs.consilium.dev](https://docs.consilium.dev)
- **Issues**: [https://github.com/yourusername/consilium/issues](https://github.com/yourusername/consilium/issues)

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

**Built with ❤️ for developers who want to code smarter, not harder.**
