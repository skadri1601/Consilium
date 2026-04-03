import * as path from "path";

export interface ArchitectureInfo {
  patterns: string[];
  keyAbstractions: string[];
  dataFlow: string[];
  sourceFileCount: number;
}

function detectPatterns(sourceFiles: Map<string, string>, filePaths: string[]): string[] {
  const patterns: string[] = [];
  const dirs = new Set(filePaths.map((f) => path.dirname(f)));
  const dirNames = new Set(filePaths.map((f) => path.dirname(f).split(path.sep)).flat());

  const hasDirs = (...names: string[]) => names.some((n) => dirNames.has(n));

  if (hasDirs("controllers", "models", "views") || hasDirs("controller", "model", "view")) {
    patterns.push("MVC");
  }

  if (hasDirs("services") || hasDirs("service")) {
    patterns.push("service-layer");
  }

  if (hasDirs("middleware") || hasDirs("middlewares")) {
    patterns.push("middleware");
  }

  if (hasDirs("resolvers", "schema", "graphql")) {
    patterns.push("GraphQL");
  }

  if (hasDirs("routes", "api")) {
    patterns.push("REST");
  }

  if (hasDirs("components", "pages", "hooks")) {
    patterns.push("component-based");
  }

  if (hasDirs("commands", "handlers", "events")) {
    patterns.push("CQRS");
  }

  if (hasDirs("repositories", "repository")) {
    patterns.push("repository");
  }

  let hasDockerCompose = false;
  let serviceCount = 0;
  for (const fp of filePaths) {
    if (fp.includes("docker-compose")) hasDockerCompose = true;
    if (fp.includes("Dockerfile")) serviceCount++;
  }

  if (hasDockerCompose && serviceCount > 1) {
    patterns.push("microservices");
  } else if (dirs.size > 0 && !patterns.includes("microservices")) {
    patterns.push("monolith");
  }

  let hasServerless = false;
  for (const [, content] of sourceFiles) {
    if (content.includes("serverless") || content.includes("lambda") || content.includes("@aws-cdk")) {
      hasServerless = true;
      break;
    }
  }
  if (hasServerless || filePaths.some((f) => f.includes("serverless.yml") || f.includes("serverless.ts"))) {
    patterns.push("serverless");
  }

  return [...new Set(patterns)];
}

function detectAbstractions(sourceFiles: Map<string, string>): string[] {
  const abstractions = new Set<string>();

  const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g;
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
  const typeRegex = /(?:export\s+)?type\s+(\w+)/g;

  for (const [, content] of sourceFiles) {
    let match;
    while ((match = classRegex.exec(content)) !== null) abstractions.add(match[1]);
    while ((match = interfaceRegex.exec(content)) !== null) abstractions.add(match[1]);
    while ((match = typeRegex.exec(content)) !== null) abstractions.add(match[1]);
  }

  return Array.from(abstractions).slice(0, 50);
}

function detectDataFlow(sourceFiles: Map<string, string>): string[] {
  const flows: string[] = [];
  const allContent = Array.from(sourceFiles.values()).join("\n");

  if (allContent.includes("fetch(") || allContent.includes("axios") || allContent.includes("http.get")) {
    flows.push("HTTP client");
  }
  if (allContent.includes("createConnection") || allContent.includes("mongoose") || allContent.includes("prisma") || allContent.includes("sequelize")) {
    flows.push("database");
  }
  if (allContent.includes("Redis") || allContent.includes("redis") || allContent.includes("ioredis")) {
    flows.push("cache");
  }
  if (allContent.includes("WebSocket") || allContent.includes("socket.io") || allContent.includes("ws")) {
    flows.push("websocket");
  }
  if (allContent.includes("amqp") || allContent.includes("rabbitmq") || allContent.includes("kafka") || allContent.includes("bullmq")) {
    flows.push("message-queue");
  }
  if (allContent.includes("createReadStream") || allContent.includes("pipeline") || allContent.includes("Transform")) {
    flows.push("streams");
  }
  if (allContent.includes("EventEmitter") || allContent.includes("on(") || allContent.includes("emit(")) {
    flows.push("event-driven");
  }

  return flows;
}

export function analyzeArchitecture(sourceFiles: Map<string, string>): ArchitectureInfo {
  const filePaths = Array.from(sourceFiles.keys());

  return {
    patterns: detectPatterns(sourceFiles, filePaths),
    keyAbstractions: detectAbstractions(sourceFiles),
    dataFlow: detectDataFlow(sourceFiles),
    sourceFileCount: sourceFiles.size,
  };
}
