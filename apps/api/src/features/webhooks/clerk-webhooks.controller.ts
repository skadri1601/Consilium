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
} from "@nestjs/common";
import { Webhook } from "svix";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { RateLimit } from "../../shared/decorators/rate-limit.decorator";
import type { FastifyRequest } from "fastify";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface ClerkSessionData {
  user_id: string;
  id: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData | ClerkSessionData;
}

@Controller("webhooks/clerk")
@UseGuards(RateLimitGuard)
@RateLimit(50, 60)
export class ClerkWebhooksController {
  private readonly logger = new Logger(ClerkWebhooksController.name);

  constructor(private readonly webhooksService: ClerkWebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string,
    @Req() req: FastifyRequest,
  ) {
    const event = this.verifyAndParse(req, svixId, svixTimestamp, svixSignature);

    this.logger.log(`Processing Clerk webhook: ${event.type}`);

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const data = event.data as ClerkUserData;
        const primaryEmail = data.email_addresses.find(
          (e) => e.id === data.primary_email_address_id,
        );
        const payload = {
          clerkId: data.id,
          email: primaryEmail?.email_address,
          firstName: data.first_name ?? undefined,
          lastName: data.last_name ?? undefined,
          imageUrl: data.image_url ?? undefined,
        };

        if (event.type === "user.created") {
          return this.webhooksService.createUser(payload);
        }
        return this.webhooksService.updateUser(payload);
      }

      case "user.deleted": {
        const data = event.data as ClerkUserData;
        return this.webhooksService.deleteUser(data.id);
      }

      case "session.ended":
      case "session.removed":
      case "session.revoked": {
        const data = event.data as ClerkSessionData;
        return this.webhooksService.handleSessionEnded(
          data.user_id,
          data.id,
        );
      }

      default:
        this.logger.warn(`Unhandled Clerk event: ${event.type}`);
        return { received: true };
    }
  }

  private verifyAndParse(
    req: FastifyRequest,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ): ClerkWebhookEvent {
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.error("CLERK_WEBHOOK_SECRET not configured");
      throw new UnauthorizedException("Webhook endpoint not configured");
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new UnauthorizedException("Missing Svix headers");
    }

    const wh = new Webhook(secret);
    const body = JSON.stringify(req.body);

    try {
      return wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      throw new UnauthorizedException("Invalid webhook signature");
    }
  }
}
