import { Module, forwardRef } from "@nestjs/common";
import { DebatesController } from "./debates.controller";
import { DebatesService } from "./debates.service";
import { ApiKeysModule } from "../api-keys/api-keys.module";
import { AuthModule } from "../auth/auth.module";
import { AiWorkersClient } from "./ai-workers.client";
import { SseProxyService } from "./sse-proxy.service";
import { PersonasModule } from "../personas/personas.module";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { DebateQueueModule } from "../../shared/queue/debate-queue.module";
import { ConversationsModule } from "../conversations/conversations.module";

@Module({
  imports: [
    ApiKeysModule,
    AuthModule,
    PersonasModule,
    ConversationsModule,
    forwardRef(() => DebateQueueModule),
  ],
  controllers: [DebatesController],
  providers: [DebatesService, AiWorkersClient, SseProxyService, RateLimitGuard],
  exports: [DebatesService, AiWorkersClient, SseProxyService],
})
export class DebatesModule {}
