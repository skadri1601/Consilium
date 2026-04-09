import { Module } from "@nestjs/common";
import { DeliberationController } from "./deliberation.controller";
import { DeliberationService } from "./deliberation.service";
import { DeliberationEventsClient } from "./deliberation-events.client";
import { DeliberationSseService } from "./deliberation-sse.service";
import { ApiKeysModule } from "../api-keys/api-keys.module";
import { AuthModule } from "../auth/auth.module";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";

@Module({
  imports: [ApiKeysModule, AuthModule],
  controllers: [DeliberationController],
  providers: [
    DeliberationService,
    DeliberationEventsClient,
    DeliberationSseService,
    RateLimitGuard,
  ],
  exports: [DeliberationService],
})
export class DeliberationModule {}
