import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface DeliberationStartRequest {
  deliberationId: string;
  topic: string;
  mode: string;
  models: string[];
  maxRounds?: number;
  apiKeys: {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
    xaiKey?: string;
  };
}

export interface DeliberationStartResponse {
  deliberationId: string;
  status: string;
}

@Injectable()
export class DeliberationEventsClient {
  private readonly logger = new Logger(DeliberationEventsClient.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>("AI_WORKERS_URL") ||
      process.env.AI_WORKERS_URL ||
      "http://localhost:8000";
  }

  async startDeliberation(
    request: DeliberationStartRequest,
  ): Promise<DeliberationStartResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/deliberation/start`;

      this.logger.log(
        `Starting deliberation [${request.mode}] with models: ${request.models.join(", ")}`,
      );

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliberation_id: request.deliberationId,
          topic: request.topic,
          mode: request.mode,
          models: request.models,
          max_rounds: request.maxRounds,
          api_keys: {
            openai_key: request.apiKeys.openaiKey,
            anthropic_key: request.apiKeys.anthropicKey,
            google_key: request.apiKeys.googleKey,
            groq_key: request.apiKeys.groqKey,
            xai_key: request.apiKeys.xaiKey,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Deliberation workers error: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Failed to start deliberation: ${errorText}`,
          response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const data = await response.json();
      return {
        deliberationId: data.deliberation_id || data.deliberationId || data.id,
        status: data.status || "processing",
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Error calling deliberation workers: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        "Failed to connect to deliberation workers service",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  getStreamUrl(deliberationId: string): string {
    if (!this.isValidUuid(deliberationId)) {
      throw new HttpException(
        "Invalid deliberation ID format",
        HttpStatus.BAD_REQUEST,
      );
    }
    return `${this.baseUrl}/api/v1/deliberation/${deliberationId}/stream`;
  }

  private isValidUuid(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
