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
      
      this.logger.log(`Proxying SSE stream from ${streamUrl}`);

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
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error("No response body reader available");
          }

          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              subscriber.complete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  subscriber.next({
                    data: JSON.stringify(data),
                  } as MessageEvent);
                } catch (error) {
                  this.logger.warn(`Failed to parse SSE data: ${line}`, error);
                }
              } else if (line.startsWith("event: ")) {
                // Handle event type if needed
                const eventType = line.slice(7);
                // Could emit event type separately if needed
              }
            }
          }
        })
        .catch((error) => {
          this.logger.error(`SSE proxy error: ${error.message}`, error.stack);
          subscriber.error(error);
        });

      // Cleanup on unsubscribe
      return () => {
        controller.abort();
      };
    });
  }
}

