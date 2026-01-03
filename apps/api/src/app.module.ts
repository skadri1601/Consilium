import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

// Shared modules
import { PrismaModule } from "./shared/database";
import { appConfig, databaseConfig, redisConfig } from "./shared/config";

// Feature modules
import { AuthModule } from "./features/auth";
import { AgentsModule } from "./features/agents";
import { ConversationsModule } from "./features/conversations";
import { CouncilModule } from "./features/council";
import { UsersModule } from "./features/users";
import { AnalyticsModule } from "./features/analytics";

// Controllers
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      load: [appConfig, databaseConfig, redisConfig],
    }),
    PrismaModule,
    AuthModule,
    AgentsModule,
    ConversationsModule,
    CouncilModule,
    UsersModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
