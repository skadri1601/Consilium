import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

const logger = new Logger("BullMQConfig");

export const BullMQConfig = BullModule.forRootAsync({
  useFactory: (configService: ConfigService) => {
    const redisUrl =
      configService.get<string>("REDIS_URL") || "redis://localhost:6379";

    return {
      connection: {
        url: redisUrl,
        retryStrategy: (times: number) => {
          if (times > 20) {
            logger.warn(
              `BullMQ Redis connection retry #${times}, backing off to 30s`,
            );
            return 30_000;
          }
          return Math.min(times * 200, 5000);
        },
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        lazyConnect: true,
      },
    };
  },
  inject: [ConfigService],
});
