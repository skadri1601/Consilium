import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { DebateQueueService, DebateJobData } from "./debate-queue.service";
import { DebatesService } from "../../features/debates/debates.service";
import { AiWorkersClient } from "../../features/debates/ai-workers.client";

@Processor("debate-jobs")
@Injectable()
export class DebateQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(DebateQueueProcessor.name);

  constructor(
    private debatesService: DebatesService,
    private aiWorkersClient: AiWorkersClient,
  ) {
    super();
  }

  async process(job: Job<DebateJobData>) {
    this.logger.log(`Processing debate job ${job.id} for debate ${job.data.debateId}`);

    try {
      const { debateId, topic, models, userId, apiKeys } = job.data;

      // Update job progress
      await job.updateProgress(10);

      // Update status to processing
      await this.debatesService.updateStatus(debateId, "processing");

      // Call FastAPI agents service to run debate
      await job.updateProgress(30);
      
      const result = await this.aiWorkersClient.startDebate({
        topic,
        models,
        apiKeys: apiKeys || {},
      });

      await job.updateProgress(60);

      // Wait for debate to complete (in real implementation, this would poll or use webhooks)
      // For now, we'll mark as processing and let SSE handle the updates
      // The debate status will be updated via SSE events from the AI workers

      await job.updateProgress(100);

      this.logger.log(`Debate job ${job.id} completed for debate ${debateId}`);
      return { 
        success: true, 
        debateId,
        aiWorkersDebateId: result.debateId,
      };
    } catch (error) {
      this.logger.error(`Error processing debate job ${job.id}:`, error);
      
      // Update debate status to failed
      try {
        await this.debatesService.updateStatus(job.data.debateId, "failed");
      } catch (updateError) {
        this.logger.error(`Failed to update debate status:`, updateError);
      }

      // Re-throw to trigger retry logic
      throw error;
    }
  }
}

