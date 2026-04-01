import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { DebateQueueService } from "./debate-queue.service";
import { DebateQueueProcessor } from "./debate-queue.processor";
import { BullMQConfig } from "./bullmq.config";
import { DebatesModule } from "../../features/debates/debates.module";

@Module({
  imports: [
    BullMQConfig,
    DebatesModule, // Import to get DebatesService and AiWorkersClient
    BullModule.registerQueue({
      name: "debate-jobs",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    }),
  ],
  providers: [DebateQueueService, DebateQueueProcessor],
  exports: [DebateQueueService],
})
export class DebateQueueModule {}
