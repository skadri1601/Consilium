import { Injectable, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { DeliberationEventsClient } from "./deliberation-events.client";

interface SseEvent {
  data: string;
}

const PHASE_EVENTS = new Set([
  "deliberation:start",
  "deliberation:complete",
  "debate_start",
  "round_start",
  "round_complete",
  "agent_start",
  "agent_complete",
  "judge_start",
  "judge_retry",
  "consensus",
  "cost_update",
  "convergence_detected",
  "done",
  "phase:proposal",
  "phase:challenge",
  "phase:rebuttal",
  "phase:evaluation",
  "phase:voting",
  "phase:aggregation",
  "convergence:detected",
  "convergence:not_detected",
  "dissent:consensus",
  "dissent:report",
  "red_team:attack",
  "red_team:defense",
  "red_team:judgment",
  "market:bet",
  "market:update",
  "market:converged",
  "cost:update",
  "error",
]);

@Injectable()
export class DeliberationSseService {
  private readonly logger = new Logger(DeliberationSseService.name);

  constructor(private eventsClient: DeliberationEventsClient) {}

  proxyStream(deliberationId: string): Observable<SseEvent> {
    return new Observable((subscriber) => {
      const streamUrl = this.eventsClient.getStreamUrl(deliberationId);
      this.logger.log(
        `[SSE] Starting deliberation stream for ${deliberationId}`,
      );

      const controller = new AbortController();
      let eventCount = 0;

      fetch(streamUrl, {
        method: "GET",
        headers: { Accept: "text/event-stream" },
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
          let currentEvent: string | null = null;

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              this.logger.log(`[SSE] Stream ended after ${eventCount} events`);
              subscriber.complete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                currentEvent = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                try {
                  const dataStr = line.slice(6);
                  eventCount++;

                  let parsed: Record<string, unknown>;
                  try {
                    parsed = JSON.parse(dataStr);
                  } catch {
                    parsed = { raw: dataStr };
                  }

                  if (currentEvent) {
                    parsed.event = currentEvent;
                  }

                  if (!currentEvent || PHASE_EVENTS.has(currentEvent)) {
                    subscriber.next({ data: JSON.stringify(parsed) });
                  }

                  currentEvent = null;
                } catch (error) {
                  this.logger.warn(
                    `[SSE] Failed to process event: ${line}`,
                    error,
                  );
                }
              } else if (line.trim() === "") {
                currentEvent = null;
              }
            }
          }
        })
        .catch((error) => {
          this.logger.error(`[SSE] Error: ${error.message}`, error.stack);
          subscriber.error(error);
        });

      return () => {
        controller.abort();
      };
    });
  }
}
