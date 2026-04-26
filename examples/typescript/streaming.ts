import { ConsiliumClient } from "@myconsilium/sdk";
import type { DeliberationEvent } from "@myconsilium/sdk";

async function runStreamingDeliberation(): Promise<void> {
  const client = new ConsiliumClient({
    apiKey: process.env.CONSILIUM_API_KEY ?? "your-api-key-here",
    apiUrl: process.env.CONSILIUM_API_URL ?? "http://localhost:4000/api/v1",
    timeout: 180_000,
  });

  const debateTopic = [
    "Evaluate the tradeoffs of using WebAssembly (WASM) as a universal",
    "server-side runtime versus native containers (Docker/OCI). Consider",
    "cold start latency, memory isolation, ecosystem maturity, language",
    "support, debugging tooling, and production readiness for a",
    "FaaS platform serving 500k invocations per hour.",
  ].join(" ");

  const roundStartTimes = new Map<number, number>();
  let currentRound = 0;
  let eventCount = 0;

  const eventStream = client.streamDeliberation({
    topic: debateTopic,
    mode: "council",
    models: ["gpt-5.4", "claude-sonnet-4-6", "gemini-3-flash-preview"],
    maxRounds: 3,
  });

  console.log("=== Streaming Deliberation ===\n");

  for await (const event of eventStream) {
    eventCount++;
    handleEvent(event, roundStartTimes, currentRound);

    if (event.event === "round:start" && event.round !== undefined) {
      currentRound = event.round;
    }
  }

  console.log(`\nTotal events received: ${eventCount}`);
}

function handleEvent(
  event: DeliberationEvent,
  roundStartTimes: Map<number, number>,
  _currentRound: number,
): void {
  switch (event.event) {
    case "round:start":
      roundStartTimes.set(event.round ?? 0, Date.now());
      console.log(`\n--- Round ${event.round} ---\n`);
      break;

    case "agent:start":
      console.log(`[${event.agentId}] Starting...`);
      break;

    case "agent:chunk":
      console.log(`[${event.agentId}] ${truncate(event.chunk ?? "", 120)}`);
      break;

    case "agent:complete":
      console.log(`[${event.agentId}] Complete\n`);
      break;

    case "synthesis:start":
      console.log("--- Synthesis ---\n");
      break;

    case "debate:complete":
      if (event.data) {
        console.log("=== Final Result ===\n");
        console.log(`Golden Prompt:\n${event.data.goldenPrompt}\n`);
        console.log(`Cost: $${event.data.cost.toFixed(4)}`);

        console.log("\nConfidence Scores:");
        for (const [model, score] of Object.entries(event.data.confidenceScores)) {
          console.log(`  ${model}: ${(score * 100).toFixed(1)}%`);
        }
      }
      break;

    case "debate:error":
      console.error(`ERROR: ${event.message}`);
      break;
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

runStreamingDeliberation().catch(console.error);
