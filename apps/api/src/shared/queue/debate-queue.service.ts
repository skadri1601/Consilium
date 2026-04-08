import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

export interface DebateJobData {
  debateId: string;
  topic: string;
  models: string[];
  userId: string;
  apiKeys?: {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
    xaiKey?: string;
  };
}

@Injectable()
export class DebateQueueService {
  constructor(
    @InjectQueue("debate-jobs") private debateQueue: Queue<DebateJobData>,
  ) {}

  async addDebateJob(data: DebateJobData) {
    return this.debateQueue.add("process-debate", data, {
      jobId: data.debateId,
    });
  }

  async getJobStatus(jobId: string) {
    const job = await this.debateQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
      failedReason: job.failedReason,
    };
  }

  async getActiveJobs(): Promise<
    { debateId: string; progress: number; startedAt: Date }[]
  > {
    const activeJobs = await this.debateQueue.getActive();
    return activeJobs.map((job) => ({
      debateId: job.data.debateId,
      progress: job.progress as number,
      startedAt: new Date(job.processedOn || job.timestamp),
    }));
  }

  async removeJob(jobId: string) {
    const job = await this.debateQueue.getJob(jobId);
    if (!job) return;

    try {
      await job.remove();
    } catch {
      const state = await job.getState().catch(() => "unknown");
      if (state === "active" || state === "unknown") {
        await job.moveToFailed(
          new Error("Removed while active"),
          "0",
          false,
        );
      }
    }
  }
}
