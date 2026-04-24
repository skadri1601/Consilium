import { ConsiliumClient, DeliberationEvent, DebateEvent, ToolSchema } from "../api/client";
import { McpRegistry } from "./mcp-client/registry";
import { style } from "./visual-system";

const st = style();

const DEFAULT_BUDGET = {
  maxCallsPerTurn: 5,
  maxTotalCalls: 50,
  perCallTimeoutMs: 30000,
};

export interface ToolBridgeOptions {
  enabled: boolean;
  quiet?: boolean;
}

export interface ToolBridgeHandle {
  tools: ToolSchema[];
  toolBudget: typeof DEFAULT_BUDGET;
  handleEvent: (event: DebateEvent | DeliberationEvent, deliberationId: string) => Promise<void>;
  shutdown: () => Promise<void>;
}

export async function startToolBridge(
  client: ConsiliumClient,
  options: ToolBridgeOptions,
): Promise<ToolBridgeHandle | null> {
  if (!options.enabled) return null;

  const registry = new McpRegistry();
  const { started, failed } = await registry.startAll();

  if (!options.quiet) {
    if (started.length > 0) {
      console.log(st.dim(`[mcp] ${started.length} server${started.length === 1 ? "" : "s"} ready: ${started.join(", ")}`));
    }
    for (const f of failed) {
      console.log(st.warning(`[mcp] ${f.name} failed to start: ${f.error}`));
    }
  }

  const registered = registry.listTools();
  const tools: ToolSchema[] = registered.map((t) => ({
    qualifiedName: t.qualifiedName,
    description: t.tool.description,
    inputSchema: t.tool.inputSchema,
  }));

  if (tools.length === 0) {
    await registry.stopAll();
    if (!options.quiet) {
      console.log(st.dim("[mcp] no tools available — continuing without tool access"));
    }
    return null;
  }

  let totalCalls = 0;

  return {
    tools,
    toolBudget: DEFAULT_BUDGET,
    handleEvent: async (event, deliberationId) => {
      if (event.type !== "tool:call_request") return;
      const { callId, name, arguments: args } = event as { callId?: string; name?: string; arguments?: Record<string, unknown> };
      if (!callId || !name) return;

      totalCalls++;
      if (totalCalls > DEFAULT_BUDGET.maxTotalCalls) {
        await client.postToolResult(deliberationId, callId, {
          content: [{ type: "text", text: "Tool budget exhausted for this debate." }],
          isError: true,
        });
        return;
      }

      if (!options.quiet) {
        console.log(st.dim(`[mcp] ${name}(${JSON.stringify(args ?? {}).slice(0, 80)})`));
      }

      try {
        const result = await registry.callTool(name, args ?? {});
        await client.postToolResult(deliberationId, callId, result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await client.postToolResult(deliberationId, callId, {
          content: [{ type: "text", text: `Tool call failed: ${message}` }],
          isError: true,
        });
      }
    },
    shutdown: async () => {
      await registry.stopAll();
    },
  };
}
