import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { hostname } from "os";
import { DebateJobData } from "./debate-queue.service";
import { DebatesService } from "../../features/debates/debates.service";
import { AiWorkersClient } from "../../features/debates/ai-workers.client";
import { PrismaService } from "../../shared/database/prisma.service";

@Processor("debate-jobs")
@Injectable()
export class DebateQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(DebateQueueProcessor.name);
  private readonly workerId = `worker-${hostname()}-${process.pid}`;

  constructor(
    private debatesService: DebatesService,
    private aiWorkersClient: AiWorkersClient,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<DebateJobData>) {
    const startTime = Date.now();
    this.logger.log(
      `[${this.workerId}] Processing debate job ${job.id} for debate ${job.data.debateId}`,
    );

    try {
      const { debateId, topic, models, apiKeys } = job.data;

      await job.updateProgress(10);

      const existing = await this.prisma.debateSession.findUnique({
        where: { id: debateId },
        select: { status: true },
      });

      if (
        existing &&
        (existing.status === "completed" || existing.status === "processing")
      ) {
        this.logger.warn(
          `[${this.workerId}] Debate ${debateId} already ${existing.status}, skipping`,
        );
        await job.updateProgress(100);
        return {
          success: true,
          debateId,
          skipped: true,
          reason: `already ${existing.status}`,
          workerId: this.workerId,
          durationMs: Date.now() - startTime,
        };
      }

      await this.debatesService.updateStatus(debateId, "processing");

      await job.updateProgress(30);

      const result = await this.aiWorkersClient.startDebate({
        topic,
        models,
        apiKeys: apiKeys || {},
      });

      await job.updateProgress(60);

      await this.debatesService.updateStatus(debateId, "completed");

      await job.updateProgress(80);

      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${this.workerId}] Completed debate ${debateId} in ${duration}ms`,
      );
      return {
        success: true,
        debateId,
        aiWorkersDebateId: result.debateId,
        workerId: this.workerId,
        durationMs: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${this.workerId}] Error processing debate job ${job.id} after ${duration}ms:`,
        error,
      );

      try {
        await this.debatesService.updateStatus(job.data.debateId, "failed");
      } catch (updateError) {
        this.logger.error(`Failed to update debate status:`, updateError);
      }

      throw error;
    }
  }
}
