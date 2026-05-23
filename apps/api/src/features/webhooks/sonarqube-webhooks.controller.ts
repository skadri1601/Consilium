import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Req,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { SonarqubeWebhooksService } from "./sonarqube-webhooks.service";
import type { SonarqubeWebhookPayload } from "./sonarqube-webhooks.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { RateLimit } from "../../shared/decorators/rate-limit.decorator";
import type { RawBodyRequest } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

@Controller("webhooks/sonarqube")
@UseGuards(RateLimitGuard)
@RateLimit(50, 60)
export class SonarqubeWebhooksController {
  private readonly logger = new Logger(SonarqubeWebhooksController.name);

  constructor(private readonly webhooksService: SonarqubeWebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Headers("x-sonar-webhook-hmac-sha256") signature: string,
    @Req() req: RawBodyRequest<FastifyRequest>,
  ) {
    const secret = process.env.SONARQUBE_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.error("SONARQUBE_WEBHOOK_SECRET not configured");
      throw new UnauthorizedException("Webhook endpoint not configured");
    }

    if (!signature) {
      throw new UnauthorizedException("Missing SonarQube signature header");
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException("Empty webhook body");
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const provided = signature.trim().toLowerCase();
    const expectedBuf = Buffer.from(expected, "utf8");
    const providedBuf = Buffer.from(provided, "utf8");

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    let payload: SonarqubeWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new BadRequestException("Malformed JSON body");
    }

    this.logger.log(
      `Processing SonarQube webhook: project=${payload?.project?.key} status=${payload?.qualityGate?.status}`,
    );

    return this.webhooksService.handleAnalysisCompleted(payload);
  }
}
