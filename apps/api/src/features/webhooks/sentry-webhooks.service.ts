import { Injectable, Logger } from "@nestjs/common";
import { LinearTicketService } from "./linear-ticket.service";
import type {
  SentryEvent,
  SentryIssue,
  SentryWebhookPayload,
} from "./sentry-webhooks.controller";

export interface SentryWebhookResult {
  action: "create" | "comment" | "ignored";
  identifier?: string;
  received?: boolean;
}

@Injectable()
export class SentryWebhooksService {
  private readonly logger = new Logger(SentryWebhooksService.name);

  constructor(private readonly linearTicketService: LinearTicketService) {}

  async handleIssueCreated(
    payload: SentryWebhookPayload,
  ): Promise<SentryWebhookResult> {
    const issue = payload.data.issue;
    if (!issue) {
      this.logger.warn("Sentry issue.created received without data.issue");
      return { action: "ignored", received: true };
    }

    const event = payload.data.event;
    const environment = this.resolveEnvironment(event);
    const projectSlug = issue.project?.slug ?? "unknown";
    const culprit = issue.culprit ?? "unknown";
    const level = issue.level ?? "error";

    const description = this.buildDescription({
      issue,
      event,
      culprit,
      projectSlug,
      environment,
    });

    const existing = await this.linearTicketService.findByAttachmentUrl(
      issue.permalink,
    );

    if (existing) {
      this.logger.log(
        `Existing Linear ticket ${existing.identifier} for Sentry ${issue.shortId} - adding recurrence comment`,
      );
      await this.linearTicketService.addRecurrenceComment(
        existing.issueId,
        "sentry",
        {
          shortId: issue.shortId,
          level,
          culprit,
          environment,
        },
      );
      return { action: "comment", identifier: existing.identifier };
    }

    const created = await this.linearTicketService.createTicket({
      source: "sentry",
      title: `[Sentry ${level}] ${issue.title}`,
      description,
      attachmentUrl: issue.permalink,
      attachmentTitle: `Sentry ${issue.shortId}`,
      environment,
      externalId: issue.shortId,
      severity: level,
    });

    this.logger.log(
      `Created Linear ticket ${created.identifier} for Sentry ${issue.shortId}`,
    );

    return { action: "create", identifier: created.identifier };
  }

  async handleEventAlert(
    payload: SentryWebhookPayload,
  ): Promise<SentryWebhookResult> {
    const event = payload.data.event;
    const issue = payload.data.issue;

    if (!event && !issue) {
      this.logger.warn("Sentry event_alert received without event or issue");
      return { action: "ignored", received: true };
    }

    const environment = this.resolveEnvironment(event);
    const level = event?.level ?? issue?.level ?? "error";
    const title =
      issue?.title ??
      (typeof event?.["title"] === "string"
        ? (event["title"] as string)
        : payload.data.triggered_rule || "Sentry alert");
    const permalink =
      issue?.permalink ??
      event?.web_url ??
      event?.issue_url ??
      `sentry-event:${event?.event_id ?? "unknown"}`;
    const externalId = issue?.shortId ?? event?.event_id ?? "unknown";
    const culprit = issue?.culprit ?? "unknown";
    const projectSlug = issue?.project?.slug ?? "unknown";

    const description = this.buildAlertDescription({
      issue,
      event,
      culprit,
      projectSlug,
      environment,
      triggeredRule: payload.data.triggered_rule,
    });

    const existing =
      await this.linearTicketService.findByAttachmentUrl(permalink);

    if (existing) {
      await this.linearTicketService.addRecurrenceComment(
        existing.issueId,
        "sentry",
        {
          shortId: externalId,
          level,
          culprit,
          environment,
        },
      );
      return { action: "comment", identifier: existing.identifier };
    }

    const created = await this.linearTicketService.createTicket({
      source: "sentry",
      title: `[Sentry ${level}] ${title}`,
      description,
      attachmentUrl: permalink,
      attachmentTitle: `Sentry ${externalId}`,
      environment,
      externalId,
      severity: level,
    });

    return { action: "create", identifier: created.identifier };
  }

  private resolveEnvironment(event?: SentryEvent): string {
    if (!event) return "unknown";
    if (typeof event.environment === "string" && event.environment) {
      return event.environment;
    }
    return "unknown";
  }

  private buildDescription(args: {
    issue: SentryIssue;
    event?: SentryEvent;
    culprit: string;
    projectSlug: string;
    environment: string;
  }): string {
    const { issue, event, culprit, projectSlug, environment } = args;
    const lines: string[] = [];
    lines.push(`**Project:** ${projectSlug}`);
    lines.push(`**Environment:** ${environment}`);
    lines.push(`**Culprit:** ${culprit}`);
    lines.push(`**Level:** ${issue.level}`);
    if (event?.event_id) {
      lines.push(`**Last event fingerprint:** ${event.event_id}`);
    }
    if (issue.metadata?.type) {
      lines.push(`**Type:** ${issue.metadata.type}`);
    }
    if (issue.metadata?.value) {
      lines.push(`**Value:** ${issue.metadata.value}`);
    }

    const tagLines = this.formatTags(event?.tags);
    if (tagLines.length > 0) {
      lines.push("");
      lines.push("**Tags:**");
      tagLines.forEach((t) => lines.push(`- ${t}`));
    }

    lines.push("");
    lines.push(`**Permalink:** ${issue.permalink}`);
    return lines.join("\n");
  }

  private buildAlertDescription(args: {
    issue?: SentryIssue;
    event?: SentryEvent;
    culprit: string;
    projectSlug: string;
    environment: string;
    triggeredRule?: string;
  }): string {
    const { issue, event, culprit, projectSlug, environment, triggeredRule } =
      args;
    const lines: string[] = [];
    lines.push(`**Project:** ${projectSlug}`);
    lines.push(`**Environment:** ${environment}`);
    lines.push(`**Culprit:** ${culprit}`);
    if (triggeredRule) {
      lines.push(`**Triggered rule:** ${triggeredRule}`);
    }
    if (event?.event_id) {
      lines.push(`**Event id:** ${event.event_id}`);
    }
    if (event?.server_name) {
      lines.push(`**Server:** ${event.server_name}`);
    }
    if (issue?.metadata?.type) {
      lines.push(`**Type:** ${issue.metadata.type}`);
    }
    const tagLines = this.formatTags(event?.tags);
    if (tagLines.length > 0) {
      lines.push("");
      lines.push("**Tags:**");
      tagLines.forEach((t) => lines.push(`- ${t}`));
    }
    if (issue?.permalink) {
      lines.push("");
      lines.push(`**Permalink:** ${issue.permalink}`);
    }
    return lines.join("\n");
  }

  private formatTags(
    tags?: Array<[string, string]> | Record<string, string>,
  ): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) {
      return tags
        .filter((entry) => Array.isArray(entry) && entry.length === 2)
        .map(([k, v]) => `${k}: ${v}`);
    }
    if (typeof tags === "object") {
      return Object.entries(tags).map(([k, v]) => `${k}: ${v}`);
    }
    return [];
  }
}
