import { ConsiliumClient } from "@consilium/sdk";
import type { DeliberationEvent } from "@consilium/sdk";

async function runStreamingDeliberation(): Promise<void> {
  const client = new ConsiliumClient({
    apiKey: process.env.CONSILIUM_API_KEY ?? "your-api-key-here",
    apiUrl: process.env.CONSILIUM_API_URL ?? "http://localhost:3000/api",
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
    models: ["gpt-4o", "claude-sonnet-4-20250514", "gemini-2.0-flash"],
    maxRounds: 3,
  });

  console.log("=== Streaming Deliberation ===\n");

  for await (const event of eventStream) {
    eventCount++;
    handleEvent(event, roundStartTimes, currentRound);

    if (event.type === "round_start" && event.round !== undefined) {
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
  switch (event.type) {
    case "round_start":
      roundStartTimes.set(event.round ?? 0, Date.now());
      console.log(`\n--- Round ${event.round} ---\n`);
      break;

    case "argument":
      console.log(`[${event.model}] Argument:`);
      console.log(`  ${truncate(event.content ?? "", 120)}\n`);
      break;

    case "rebuttal":
      console.log(`[${event.model}] Rebuttal:`);
      console.log(`  ${truncate(event.content ?? "", 120)}\n`);
      break;

    case "vote":
      console.log(`[${event.model}] Vote: ${event.content}\n`);
      break;

    case "synthesis":
      console.log("--- Synthesis ---");
      console.log(`  ${truncate(event.content ?? "", 200)}\n`);
      break;

    case "result":
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

    case "error":
      console.error(`ERROR: ${event.content}`);
      break;
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

runStreamingDeliberation().catch(console.error);
