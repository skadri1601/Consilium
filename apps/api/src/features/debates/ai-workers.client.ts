import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface DebateStartRequest {
  debateId?: string;
  topic: string;
  models: string[];
  apiKeys: {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
    xaiKey?: string;
  };
  systemPrompt?: string;
  mode?: string;
  debateSource?: string;
  roundCount?: number;
  projectContext?: Record<string, any>;
}

export interface DebateStartResponse {
  debateId: string;
  status: string;
}

@Injectable()
export class AiWorkersClient {
  private readonly logger = new Logger(AiWorkersClient.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>("AI_WORKERS_URL") ||
      process.env.AI_WORKERS_URL ||
      "http://localhost:8000";
  }

  /**
   * Start a debate workflow in the AI workers service
   */
  async startDebate(request: DebateStartRequest): Promise<DebateStartResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/debates/start`;

      this.logger.log(
        `Starting debate with models: ${request.models.join(", ")}`,
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          debate_id: request.debateId,
          topic: request.topic,
          models: request.models,
          api_keys: {
            openai_key: request.apiKeys.openaiKey,
            anthropic_key: request.apiKeys.anthropicKey,
            google_key: request.apiKeys.googleKey,
            groq_key: request.apiKeys.groqKey,
            xai_key: request.apiKeys.xaiKey,
          },
          ...(request.systemPrompt && { system_prompt: request.systemPrompt }),
          ...(request.mode && { mode: request.mode }),
          ...(request.debateSource && { debate_source: request.debateSource }),
          ...(request.roundCount && { round_count: request.roundCount }),
          ...(request.projectContext && {
            project_context: request.projectContext,
          }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `AI workers error: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Failed to start debate: ${errorText}`,
          response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const data = await response.json();
      return {
        debateId: data.debate_id || data.debateId,
        status: data.status || "processing",
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Error calling AI workers: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        "Failed to connect to AI workers service",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get the SSE stream URL for a debate
   */
  getStreamUrl(debateId: string): string {
    return `${this.baseUrl}/api/v1/debates/${debateId}/stream`;
  }

  /**
   * Check if AI workers service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.warn(`AI workers health check failed: ${error.message}`);
      return false;
    }
  }
}
