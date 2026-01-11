import { Module } from "@nestjs/common";
import { DebatesController } from "./debates.controller";
import { DebatesService } from "./debates.service";
import { ApiKeysModule } from "../api-keys/api-keys.module";
import { AuthModule } from "../auth/auth.module";
import { AiWorkersClient } from "./ai-workers.client";
import { SseProxyService } from "./sse-proxy.service";

@Module({
  imports: [ApiKeysModule, AuthModule],
  controllers: [DebatesController],
  providers: [DebatesService, AiWorkersClient, SseProxyService],
  exports: [DebatesService, AiWorkersClient, SseProxyService],
})
export class DebatesModule {}

