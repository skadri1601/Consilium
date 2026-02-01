import { Injectable, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { AiWorkersClient } from "./ai-workers.client";

@Injectable()
export class SseProxyService {
  private readonly logger = new Logger(SseProxyService.name);

  constructor(private aiWorkersClient: AiWorkersClient) {}

  /**
   * Proxy SSE stream from FastAPI AI workers to frontend
   */
  proxyStream(debateId: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const streamUrl = this.aiWorkersClient.getStreamUrl(debateId);

      this.logger.log(`[SSE PROXY] Starting stream proxy for debate ${debateId}`);
      this.logger.log(`[SSE PROXY] Fetching from: ${streamUrl}`);

      // Use EventSource-like functionality via fetch with streaming
      const controller = new AbortController();

      fetch(streamUrl, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
        },
        signal: controller.signal,
      })
        .then(async (response) => {
          this.logger.log(`[SSE PROXY] Response status: ${response.status}`);
          this.logger.log(`[SSE PROXY] Response headers:`, response.headers);

          if (!response.ok) {
            this.logger.error(`[SSE PROXY] HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            this.logger.error("[SSE PROXY] No response body reader available");
            throw new Error("No response body reader available");
          }

          this.logger.log("[SSE PROXY] Starting to read stream...");
          let buffer = "";
          let currentEvent: string | null = null;
          let eventCount = 0;

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              this.logger.log(`[SSE PROXY] Stream ended after ${eventCount} events`);
              subscriber.complete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                // Store the event type for the next data line
                currentEvent = line.slice(7).trim();
                this.logger.debug(`[SSE PROXY] Event type: ${currentEvent}`);
              } else if (line.startsWith("data: ")) {
                try {
                  const dataStr = line.slice(6);
                  eventCount++;
                  this.logger.log(`[SSE PROXY] Event #${eventCount} (${currentEvent}): ${dataStr.substring(0, 100)}...`);

                  // Emit the message with event type and data
                  subscriber.next({
                    type: currentEvent || "message",
                    data: dataStr,
                  } as MessageEvent);
                  currentEvent = null; // Reset after emitting
                } catch (error) {
                  this.logger.warn(`[SSE PROXY] Failed to process SSE data: ${line}`, error);
                }
              } else if (line.trim() === "") {
                // Empty line separates events
                currentEvent = null;
              }
            }
          }
        })
        .catch((error) => {
          this.logger.error(`[SSE PROXY] Error: ${error.message}`, error.stack);
          subscriber.error(error);
        });

      // Cleanup on unsubscribe
      return () => {
        controller.abort();
      };
    });
  }
}

