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
  private readonly consiliumApiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>("AI_WORKERS_URL") ||
      process.env.AI_WORKERS_URL ||
      "http://localhost:8000";
    this.consiliumApiKey =
      this.configService.get<string>("CONSILIUM_API_KEY") ||
      process.env.CONSILIUM_API_KEY ||
      "";
  }

  getAuthHeaders(): Record<string, string> {
    return this.consiliumApiKey
      ? { Authorization: `Bearer ${this.consiliumApiKey}` }
      : {};
  }

  /**
   * Start a debate workflow in the AI workers service
   */
  async startDebate(request: DebateStartRequest): Promise<DebateStartResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/debates/start`;

      const apiDebug = this.configService.get<boolean>("app.apiDebug");
      const startMsg = `Starting debate with models: ${request.models.join(", ")}`;
      if (apiDebug) {
        this.logger.log(startMsg);
      } else {
        this.logger.debug(startMsg);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
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
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error calling AI workers: ${message}`, stack);
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
    if (!this.isValidId(debateId)) {
      throw new HttpException(
        "Invalid debate ID format",
        HttpStatus.BAD_REQUEST,
      );
    }
    return `${this.baseUrl}/api/v1/debates/${debateId}/stream`;
  }

  private isValidId(id: string): boolean {
    const idRegex = /^[0-9a-z-]{1,128}$/i;
    return idRegex.test(id);
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
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI workers health check failed: ${message}`);
      return false;
    }
  }
}
