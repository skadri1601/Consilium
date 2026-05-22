import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  UnauthorizedException,
  RawBodyRequest,
} from "@nestjs/common";
import * as crypto from "crypto";
import type { FastifyRequest } from "fastify";
import { SentryWebhooksService } from "./sentry-webhooks.service";

export interface SentryIssueProject {
  id?: string | number;
  slug?: string;
  name?: string;
}

export interface SentryIssueMetadata {
  title?: string;
  type?: string;
  value?: string;
  filename?: string;
  function?: string;
  [key: string]: unknown;
}

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit?: string | null;
  permalink: string;
  level: string;
  project?: SentryIssueProject;
  metadata?: SentryIssueMetadata;
  platform?: string;
  status?: string;
  count?: string | number;
  userCount?: number;
  firstSeen?: string;
  lastSeen?: string;
}

export interface SentryEvent {
  event_id?: string;
  environment?: string;
  user?: Record<string, unknown> | null;
  server_name?: string;
  tags?: Array<[string, string]> | Record<string, string>;
  level?: string;
  release?: string;
  platform?: string;
  web_url?: string;
  issue_url?: string;
  [key: string]: unknown;
}

export interface SentryWebhookPayload {
  action: string;
  installation?: { uuid: string };
  data: {
    issue?: SentryIssue;
    event?: SentryEvent;
    triggered_rule?: string;
    [key: string]: unknown;
  };
  actor?: { type: string; id: string | number; name: string };
}

@Controller("webhooks/sentry")
export class SentryWebhooksController {
  private readonly logger = new Logger(SentryWebhooksController.name);

  constructor(private readonly webhooksService: SentryWebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Headers("sentry-hook-signature") signature: string,
    @Headers("sentry-hook-resource") resource: string,
    @Req() req: RawBodyRequest<FastifyRequest>,
  ): Promise<unknown> {
    this.verifySignature(req, signature);

    const payload = this.parsePayload(req);

    this.logger.log(
      `Sentry webhook received: resource=${resource} action=${payload.action}`,
    );

    switch (resource) {
      case "issue":
        if (payload.action === "created") {
          return this.webhooksService.handleIssueCreated(payload);
        }
        this.logger.log(
          `Ignored sentry issue action: ${payload.action}`,
        );
        return { received: true, ignored: true };

      case "event_alert":
        return this.webhooksService.handleEventAlert(payload);

      case "error":
      case "installation":
      case "metric_alert":
      case "comment":
      case "seer":
      case "preprod_artifact":
        this.logger.log(`Ignored sentry resource: ${resource}`);
        return { received: true, ignored: true };

      default:
        this.logger.warn(`Unknown sentry resource: ${resource}`);
        return { received: true, ignored: true };
    }
  }

  private verifySignature(
    req: RawBodyRequest<FastifyRequest>,
    signature: string,
  ): void {
    const secret = process.env.SENTRY_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.error("SENTRY_WEBHOOK_SECRET not configured");
      throw new UnauthorizedException("Webhook endpoint not configured");
    }

    if (!signature) {
      throw new UnauthorizedException("Missing signature header");
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new UnauthorizedException("Missing request body");
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expected, "utf8");
    const providedBuf = Buffer.from(signature, "utf8");

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      throw new UnauthorizedException("Invalid signature");
    }
  }

  private parsePayload(
    req: RawBodyRequest<FastifyRequest>,
  ): SentryWebhookPayload {
    if (req.body && typeof req.body === "object") {
      return req.body as SentryWebhookPayload;
    }
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException("Missing request body");
    }
    try {
      return JSON.parse(rawBody.toString("utf8")) as SentryWebhookPayload;
    } catch {
      throw new UnauthorizedException("Malformed payload");
    }
  }
}
