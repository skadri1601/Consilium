import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, MaxLength, IsOptional } from "class-validator";
import { ConfigService } from "@nestjs/config";
import type { FastifyRequest } from "fastify";

class CritiqueDto {
  @ApiProperty({ description: "Text to critique", maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  text: string;

  @ApiPropertyOptional({ description: "Specific aspect to focus the critique on" })
  @IsOptional()
  @IsString()
  aspect?: string;
}

interface RateEntry {
  count: number;
  resetAt: number;
}

@ApiTags("public")
@Controller("public")
export class PublicController {
  private readonly rateLimitMap = new Map<string, RateEntry>();
  private readonly aiWorkersBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.aiWorkersBaseUrl =
      this.configService.get<string>("AI_WORKERS_URL") ||
      process.env.AI_WORKERS_URL ||
      "http://localhost:8000";
  }

  @Post("critique")
  @ApiOperation({ summary: "Devil's advocate critique of any text (public, rate-limited)" })
  @ApiResponse({ status: 200, description: "Critique result" })
  @ApiResponse({ status: 429, description: "Rate limit exceeded" })
  async critique(@Body() dto: CritiqueDto, @Req() req: FastifyRequest) {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";

    const now = Date.now();
    const hourMs = 3600 * 1000;
    const entry = this.rateLimitMap.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= 5) {
        throw new HttpException(
          { error: "Rate limit exceeded", retryAfter: 3600 },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      entry.count++;
    } else {
      this.rateLimitMap.set(ip, { count: 1, resetAt: now + hourMs });
    }

    const aspectClause = dto.aspect
      ? ` Focus specifically on: ${dto.aspect}.`
      : "";

    const prompt = `You are a rigorous devil's advocate. Identify the 3 strongest weaknesses, flawed assumptions, and counter-arguments to the following text. Be specific and evidence-based.${aspectClause}\n\nTEXT: ${dto.text}`;

    let critiqueText: string;
    try {
      const response = await fetch(`${this.aiWorkersBaseUrl}/api/v1/quick-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          prompt,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`AI workers responded with ${response.status}`);
      }

      const data = await response.json();
      critiqueText = data.content || data.text || data.completion || "";
    } catch {
      throw new HttpException(
        "Failed to generate critique. Please try again.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const lines = critiqueText
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && /^\d+[\.\)]/.test(l));

    const weaknesses = lines.length > 0 ? lines.slice(0, 3) : [critiqueText];

    return {
      critique: critiqueText,
      weaknesses,
      timestamp: new Date().toISOString(),
      cached: false,
    };
  }
}
