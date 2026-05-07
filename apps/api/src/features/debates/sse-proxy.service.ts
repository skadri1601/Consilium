import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable } from "rxjs";
import { AiWorkersClient } from "./ai-workers.client";
import { DebatesService } from "./debates.service";
import { ConversationV2Service } from "../conversations/conversation-v2.service";

interface SseEvent {
  data: string;
}

@Injectable()
export class SseProxyService {
  private readonly logger = new Logger(SseProxyService.name);

  constructor(
    private aiWorkersClient: AiWorkersClient,
    @Inject(forwardRef(() => DebatesService))
    private debatesService: DebatesService,
    private conversationV2Service: ConversationV2Service,
    private configService: ConfigService,
  ) {}

  private sseVerbose(msg: string): void {
    if (this.configService.get<boolean>("app.apiDebug")) {
      this.logger.log(msg);
    } else {
      this.logger.debug(msg);
    }
  }

  proxyStream(debateId: string): Observable<SseEvent> {
    return new Observable((subscriber) => {
      const streamUrl = this.aiWorkersClient.getStreamUrl(debateId);
      this.sseVerbose(
        `[SSE PROXY] Starting stream proxy for debate ${debateId}`,
      );
      this.sseVerbose(`[SSE PROXY] Fetching from: ${streamUrl}`);

      const controller = new AbortController();
      let goldenPrompt: string | undefined;
      let totalCost: number | undefined;
      let totalTokens: number | undefined;
      let statusUpdated = false;

      fetch(streamUrl, {
        method: "GET",
        headers: { Accept: "text/event-stream" },
        signal: controller.signal,
      })
        .then(async (response) => {
          this.sseVerbose(`[SSE PROXY] Response status: ${response.status}`);

          if (!response.ok) {
            this.logger.error(
              `[SSE PROXY] HTTP error! status: ${response.status}`,
            );
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            this.logger.error("[SSE PROXY] No response body reader available");
            throw new Error("No response body reader available");
          }

          this.sseVerbose("[SSE PROXY] Starting to read stream...");
          const MAX_BUFFER_SIZE = 1024 * 1024;
          let buffer = "";
          let currentEvent: string | null = null;
          let eventCount = 0;

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              this.sseVerbose(
                `[SSE PROXY] Stream ended after ${eventCount} events`,
              );
              if (!statusUpdated) {
                statusUpdated = true;
                await this.handleStreamComplete(
                  debateId,
                  goldenPrompt,
                  totalCost,
                  totalTokens,
                );
              }
              subscriber.complete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            if (buffer.length > MAX_BUFFER_SIZE) {
              this.logger.error(
                "[SSE PROXY] Buffer exceeded 1MB limit, aborting",
              );
              subscriber.error(new Error("SSE buffer overflow"));
              return;
            }
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                currentEvent = line.slice(7).trim();
                this.logger.debug(`[SSE PROXY] Event type: ${currentEvent}`);
              } else if (line.startsWith("data: ")) {
                try {
                  const dataStr = line.slice(6);
                  eventCount++;
                  this.sseVerbose(
                    `[SSE PROXY] Event #${eventCount} (${currentEvent}): ${dataStr.substring(0, 100)}...`,
                  );

                  let parsed: Record<string, unknown>;
                  try {
                    parsed = JSON.parse(dataStr);
                  } catch {
                    parsed = { raw: dataStr };
                  }

                  if (currentEvent === "consensus") {
                    const gp = (parsed.golden_prompt ||
                      parsed.goldenPrompt ||
                      parsed.consensus) as string | undefined;
                    if (gp) {
                      goldenPrompt = gp;
                    }
                  }

                  if (currentEvent === "done") {
                    const doneGp = (parsed.golden_prompt ||
                      parsed.goldenPrompt) as string | undefined;
                    if (doneGp && !goldenPrompt) {
                      goldenPrompt = doneGp;
                    }
                    if (parsed.total_cost !== undefined) {
                      totalCost = parsed.total_cost as number;
                    }
                    if (parsed.total_tokens !== undefined) {
                      totalTokens = parsed.total_tokens as number;
                    }
                    if (!statusUpdated) {
                      statusUpdated = true;
                      await this.handleStreamComplete(
                        debateId,
                        goldenPrompt,
                        totalCost,
                        totalTokens,
                      );
                    }
                  }

                  if (currentEvent) {
                    parsed.event = currentEvent;
                  }

                  if (parsed.golden_prompt && !parsed.goldenPrompt) {
                    parsed.goldenPrompt = parsed.golden_prompt;
                  }

                  subscriber.next({ data: JSON.stringify(parsed) });
                  currentEvent = null;
                } catch (error) {
                  this.logger.warn(
                    `[SSE PROXY] Failed to process SSE data: ${line}`,
                    error,
                  );
                }
              } else if (line.trim() === "") {
                currentEvent = null;
              }
            }
          }
        })
        .catch(async (error) => {
          this.logger.error(`[SSE PROXY] Error: ${error.message}`, error.stack);
          if (!statusUpdated) {
            statusUpdated = true;
            await this.handleStreamError(debateId, error);
          }
          subscriber.error(error);
        });

      return () => {
        controller.abort();
      };
    });
  }

  private async handleStreamComplete(
    debateId: string,
    goldenPrompt?: string,
    totalCost?: number,
    totalTokens?: number,
  ): Promise<void> {
    try {
      this.sseVerbose(
        `[SSE PROXY] Updating debate ${debateId} status to completed`,
      );
      await this.debatesService.updateStatus(
        debateId,
        "completed",
        goldenPrompt,
      );
      if (totalCost !== undefined) {
        await this.debatesService.updateTotalCost(debateId, totalCost);
      }
      if (totalCost !== undefined || totalTokens !== undefined) {
        await this.debatesService.recordUsage(
          debateId,
          totalTokens ?? 0,
          totalCost ?? 0,
        );
      }
      if (goldenPrompt) {
        this.conversationV2Service
          .extractAndUpdateDecisionLog(debateId, goldenPrompt)
          .catch((err) =>
            this.logger.warn(`Decision log extraction failed: ${err}`),
          );
      }
    } catch (error) {
      this.logger.error(`[SSE PROXY] Failed to update debate status: ${error}`);
    }
  }

  private async handleStreamError(
    debateId: string,
    error: Error,
  ): Promise<void> {
    try {
      this.logger.error(
        `[SSE PROXY] Marking debate ${debateId} as failed: ${error.message}`,
      );
      await this.debatesService.updateStatus(debateId, "failed");
    } catch (updateError) {
      this.logger.error(
        `[SSE PROXY] Failed to update debate status to failed: ${updateError}`,
      );
    }
  }
}
