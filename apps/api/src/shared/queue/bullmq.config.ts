import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

const logger = new Logger("BullMQConfig");

export const BullMQConfig = BullModule.forRootAsync({
  useFactory: (configService: ConfigService) => {
    const redisUrl = configService.get<string>("REDIS_URL") || "redis://localhost:6379";

    return {
      connection: {
        url: redisUrl,
        retryStrategy: (times: number) => {
          if (times > 3) {
            logger.warn("BullMQ Redis connection failed after multiple retries. Queue features will be unavailable.");
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      },
    };
  },
  inject: [ConfigService],
});

