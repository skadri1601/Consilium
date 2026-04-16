import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "@nestjs-modules/ioredis";
import { TerminusModule } from "@nestjs/terminus";

import { PrismaModule } from "./shared/database";
import { appConfig, databaseConfig, redisConfig } from "./shared/config";
import { AuthModule } from "./features/auth";
import { AgentsModule } from "./features/agents";
import { ConversationsModule } from "./features/conversations";
import { CouncilModule } from "./features/council";
import { UsersModule } from "./features/users";
import { AnalyticsModule } from "./features/analytics";
import { ApiKeysModule } from "./features/api-keys";
import { DebatesModule } from "./features/debates";
import { DeliberationModule } from "./features/deliberation";
import { PersonasModule } from "./features/personas";
import { WebhooksModule } from "./features/webhooks";
import { WaitlistModule } from "./features/waitlist";
import { DebateQueueModule } from "./shared/queue/debate-queue.module";
import { TemplatesModule } from "./features/templates";
import { PublicModule } from "./features/public";

import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env.local", "../../.env", ".env.local", ".env"],
      load: [appConfig, databaseConfig, redisConfig],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get("REDIS_URL") || "redis://localhost:6379";
        return {
          type: "single",
          url: redisUrl,
          options: {
            retryStrategy: (times: number) => {
              return Math.min(times * 500, 5000);
            },
            maxRetriesPerRequest: 3,
            lazyConnect: false,
            enableOfflineQueue: true,
          },
        };
      },
    }),
    TerminusModule,
    PrismaModule,
    AuthModule,
    AgentsModule,
    ConversationsModule,
    CouncilModule,
    UsersModule,
    AnalyticsModule,
    ApiKeysModule,
    DebatesModule,
    DeliberationModule,
    PersonasModule,
    WebhooksModule,
    WaitlistModule,
    DebateQueueModule,
    TemplatesModule,
    PublicModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
