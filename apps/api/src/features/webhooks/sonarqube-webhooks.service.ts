import { Injectable, Logger } from "@nestjs/common";
import { LinearTicketService } from "./linear-ticket.service";

export interface SonarqubeCondition {
  metric: string;
  operator?: string;
  value?: string;
  status: string;
  errorThreshold?: string;
  onLeakPeriod?: boolean;
}

export interface SonarqubeBranch {
  name?: string;
  type?: string;
  isMain?: boolean;
}

export interface SonarqubeProject {
  key: string;
  name: string;
  url?: string;
}

export interface SonarqubeQualityGate {
  name?: string;
  status: string;
  conditions?: SonarqubeCondition[];
}

export interface SonarqubeWebhookPayload {
  serverUrl: string;
  taskId?: string;
  status?: string;
  analysedAt: string;
  revision?: string;
  branch?: SonarqubeBranch;
  project: SonarqubeProject;
  qualityGate: SonarqubeQualityGate;
}

type AnalysisResult =
  | { received: true; ignored: true; reason: string }
  | { received: true; action: "created"; identifier: string; issueId: string }
  | { received: true; action: "commented"; issueId: string };

const SEVERITY_RANK: Record<string, number> = {
  BLOCKER: 4,
  CRITICAL: 3,
  MAJOR: 2,
  MINOR: 1,
  INFO: 0,
};

@Injectable()
export class SonarqubeWebhooksService {
  private readonly logger = new Logger(SonarqubeWebhooksService.name);

  constructor(private readonly linearTicketService: LinearTicketService) {}

  async handleAnalysisCompleted(
    payload: SonarqubeWebhookPayload,
  ): Promise<AnalysisResult> {
    const gateStatus = payload?.qualityGate?.status;

    if (gateStatus !== "ERROR") {
      this.logger.log(
        `Quality gate ${gateStatus ?? "unknown"} - skipping ticket creation for project=${payload?.project?.key}`,
      );
      return { received: true, ignored: true, reason: "gate ok" };
    }

    const project = payload.project;
    const branchName = payload.branch?.name ?? "main";
    const isMain = payload.branch?.isMain ?? branchName === "main";
    const analysedAt = payload.analysedAt;

    const failingConditions = (payload.qualityGate.conditions ?? []).filter(
      (c) => c.status === "ERROR",
    );

    const environment = isMain ? "production" : "development";
    const externalId = `${project.key}:${branchName}:${analysedAt}`;
    const attachmentUrl =
      project.url ??
      `${payload.serverUrl.replace(/\/$/, "")}/dashboard?id=${encodeURIComponent(project.key)}&branch=${encodeURIComponent(branchName)}`;
    const attachmentTitle = `SonarQube ${project.name} (${branchName})`;
    const severity = this.deriveSeverity(failingConditions);
    const title = `[SonarQube] ${project.name} quality gate failed (${branchName})`;
    const description = this.buildDescription(failingConditions, payload);

    const existing =
      await this.linearTicketService.findByAttachmentUrl(attachmentUrl);

    if (existing) {
      await this.linearTicketService.addRecurrenceComment(
        existing.issueId,
        "sonarqube",
        {
          project: project.key,
          branch: branchName,
          failedConditions: String(failingConditions.length),
        },
      );
      this.logger.log(
        `SonarQube ticket recurrence noted: issueId=${existing.issueId} project=${project.key} branch=${branchName}`,
      );
      return {
        received: true,
        action: "commented",
        issueId: existing.issueId,
      };
    }

    const ticket = await this.linearTicketService.createTicket({
      source: "sonarqube",
      title,
      description,
      attachmentUrl,
      attachmentTitle,
      environment,
      externalId,
      severity,
    });

    this.logger.log(
      `SonarQube ticket created: identifier=${ticket.identifier} issueId=${ticket.issueId} project=${project.key}`,
    );

    return {
      received: true,
      action: "created",
      identifier: ticket.identifier,
      issueId: ticket.issueId,
    };
  }

  private buildDescription(
    failingConditions: SonarqubeCondition[],
    payload: SonarqubeWebhookPayload,
  ): string {
    const header = `Quality gate **${payload.qualityGate.name ?? "default"}** failed for branch \`${payload.branch?.name ?? "main"}\` at ${payload.analysedAt}.`;

    if (failingConditions.length === 0) {
      return `${header}\n\nNo per-condition details were provided by SonarQube.`;
    }

    const lines = failingConditions.map((c) => {
      const value = c.value ?? "n/a";
      const threshold = c.errorThreshold ?? "n/a";
      return `- **${c.metric}**: ${value} (threshold ${threshold})`;
    });

    return `${header}\n\n## Failing conditions\n${lines.join("\n")}`;
  }

  private deriveSeverity(conditions: SonarqubeCondition[]): string {
    if (conditions.length === 0) {
      return "error";
    }

    let highest = -1;
    for (const c of conditions) {
      const token = c.metric.toUpperCase();
      for (const [key, rank] of Object.entries(SEVERITY_RANK)) {
        if (token.includes(key) && rank > highest) {
          highest = rank;
        }
      }
    }

    if (highest >= SEVERITY_RANK.CRITICAL) return "critical";
    if (highest >= SEVERITY_RANK.MAJOR) return "error";
    if (highest >= SEVERITY_RANK.INFO) return "warning";
    return "error";
  }
}
