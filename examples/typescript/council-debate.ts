import { ConsiliumClient } from "@consilium/sdk";
import type { DeliberationResult } from "@consilium/sdk";

async function runCouncilDebate(): Promise<void> {
  const client = new ConsiliumClient({
    apiKey: process.env.CONSILIUM_API_KEY ?? "your-api-key-here",
    apiUrl: process.env.CONSILIUM_API_URL ?? "http://localhost:3000/api",
  });

  const architectureTopic = [
    "Should we adopt a CQRS/Event Sourcing architecture for our fintech",
    "transaction processing system that handles 2M daily transactions,",
    "or stick with traditional CRUD with optimistic locking? Consider:",
    "audit requirements, replay capability, eventual consistency tradeoffs,",
    "team expertise ramp-up, and operational complexity.",
  ].join(" ");

  const panelistModels = [
    "gpt-4o",
    "claude-sonnet-4-20250514",
    "gemini-2.0-flash",
  ];

  const healthStatus = await client.healthCheck();
  if (healthStatus.status !== "ok") {
    console.error(`API unhealthy: ${healthStatus.status}`);
    process.exit(1);
  }

  const costEstimate = await client.estimateCost({
    topic: architectureTopic,
    mode: "council",
  });
  console.log(`Estimated cost: $${costEstimate.estimatedCost.toFixed(4)}\n`);

  const result: DeliberationResult = await client.deliberate({
    topic: architectureTopic,
    mode: "council",
    models: panelistModels,
    maxRounds: 3,
  });

  console.log("=== Council Deliberation Result ===\n");
  console.log(`Golden Prompt:\n${result.goldenPrompt}\n`);
  console.log(`Dissent Report:\n${result.dissentReport}\n`);
  console.log(`Total Cost: $${result.cost.toFixed(4)}\n`);

  console.log("Confidence Scores:");
  for (const [model, score] of Object.entries(result.confidenceScores)) {
    console.log(`  ${model}: ${(score * 100).toFixed(1)}%`);
  }

  console.log(`\nAudit Trail: ${result.auditTrail.length} entries`);
}

runCouncilDebate().catch(console.error);
