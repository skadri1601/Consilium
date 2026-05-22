import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from "@nestjs/common";

export type TicketSource = "sentry" | "sonarqube";

export interface CreateTicketInput {
  source: TicketSource;
  title: string;
  description: string;
  attachmentUrl: string;
  attachmentTitle: string;
  environment: string;
  externalId: string;
  severity?: string;
}

export interface LinearTicket {
  issueId: string;
  identifier: string;
  url: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";

@Injectable()
export class LinearTicketService {
  private readonly logger = new Logger(LinearTicketService.name);
  private teamIdCache: string | null = null;
  private triageStateIdCache: string | null = null;
  private labelIdCache = new Map<string, string | null>();

  private get apiKey(): string {
    const key = process.env.LINEAR_API_KEY;
    if (!key) {
      throw new ServiceUnavailableException("LINEAR_API_KEY is not configured");
    }
    return key;
  }

  async findByAttachmentUrl(url: string): Promise<LinearTicket | null> {
    const query = `query($url: String!) {
      attachmentsForURL(url: $url) {
        nodes { id issue { id identifier url } }
      }
    }`;
    const data = await this.graphql<{
      attachmentsForURL: {
        nodes: Array<{
          id: string;
          issue: { id: string; identifier: string; url: string } | null;
        }>;
      };
    }>(query, { url });

    const node = data.attachmentsForURL?.nodes?.find((n) => n.issue);
    if (!node || !node.issue) {
      return null;
    }
    return {
      issueId: node.issue.id,
      identifier: node.issue.identifier,
      url: node.issue.url,
    };
  }

  async createTicket(input: CreateTicketInput): Promise<LinearTicket> {
    const teamId = await this.resolveTeamId();
    const stateId = await this.resolveTriageStateId(teamId);
    const labelName = this.labelNameForEnvironment(input.environment);
    const labelId = await this.resolveLabelId(teamId, labelName);

    const description = this.buildDescription(input);

    const mutation = `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }`;

    const issueInput: Record<string, unknown> = {
      teamId,
      title: input.title,
      description,
    };
    if (stateId) {
      issueInput.stateId = stateId;
    }
    if (labelId) {
      issueInput.labelIds = [labelId];
    }

    const data = await this.graphql<{
      issueCreate: {
        success: boolean;
        issue: { id: string; identifier: string; url: string } | null;
      };
    }>(mutation, { input: issueInput });

    if (!data.issueCreate?.success || !data.issueCreate.issue) {
      throw new BadGatewayException("Linear issueCreate did not succeed");
    }

    const issue = data.issueCreate.issue;
    await this.createAttachment(
      issue.id,
      input.attachmentUrl,
      input.attachmentTitle,
    );

    this.logger.log(
      `Created Linear ticket ${issue.identifier} for ${input.source} ${input.externalId}`,
    );

    return {
      issueId: issue.id,
      identifier: issue.identifier,
      url: issue.url,
    };
  }

  async addRecurrenceComment(
    issueId: string,
    source: TicketSource,
    metadata: Record<string, string>,
  ): Promise<void> {
    const lines = Object.entries(metadata).map(([k, v]) => `- ${k}: ${v}`);
    const body = [`**Recurrence from ${source}**`, ...lines].join("\n");

    const mutation = `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) { success comment { id } }
    }`;
    const data = await this.graphql<{
      commentCreate: { success: boolean; comment: { id: string } | null };
    }>(mutation, { input: { issueId, body } });

    if (!data.commentCreate?.success) {
      throw new BadGatewayException("Linear commentCreate did not succeed");
    }
    this.logger.log(`Added recurrence comment to Linear issue ${issueId}`);
  }

  private async createAttachment(
    issueId: string,
    url: string,
    title: string,
  ): Promise<void> {
    const mutation = `mutation($input: AttachmentCreateInput!) {
      attachmentCreate(input: $input) { success attachment { id } }
    }`;
    const data = await this.graphql<{
      attachmentCreate: {
        success: boolean;
        attachment: { id: string } | null;
      };
    }>(mutation, { input: { issueId, url, title } });

    if (!data.attachmentCreate?.success) {
      throw new BadGatewayException("Linear attachmentCreate did not succeed");
    }
  }

  private async resolveTeamId(): Promise<string> {
    if (this.teamIdCache) {
      return this.teamIdCache;
    }
    const envTeamId = process.env.LINEAR_TEAM_ID;
    if (envTeamId) {
      this.teamIdCache = envTeamId;
      return envTeamId;
    }
    const teamKey = process.env.LINEAR_TICKET_PREFIX || "MYC";
    const query = `query($key: String!) {
      teams(filter: { key: { eq: $key } }) { nodes { id key } }
    }`;
    const data = await this.graphql<{
      teams: { nodes: Array<{ id: string; key: string }> };
    }>(query, { key: teamKey });

    const node = data.teams?.nodes?.[0];
    if (!node) {
      throw new BadGatewayException(
        `No Linear team found with key '${teamKey}'`,
      );
    }
    this.teamIdCache = node.id;
    return node.id;
  }

  private async resolveTriageStateId(teamId: string): Promise<string | null> {
    if (this.triageStateIdCache !== null) {
      return this.triageStateIdCache;
    }
    const names = (
      process.env.LINEAR_TRIAGE_STATE_NAMES || "Triage,To Triage,Backlog"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const query = `query($teamId: ID!, $names: [String!]!) {
      workflowStates(filter: { team: { id: { eq: $teamId } }, name: { in: $names } }) {
        nodes { id name }
      }
    }`;
    const data = await this.graphql<{
      workflowStates: { nodes: Array<{ id: string; name: string }> };
    }>(query, { teamId, names });

    const ordered = names
      .map((n) => data.workflowStates?.nodes?.find((node) => node.name === n))
      .filter((n): n is { id: string; name: string } => Boolean(n));
    const chosen = ordered[0] || data.workflowStates?.nodes?.[0];
    if (!chosen) {
      this.logger.warn(
        `No Linear triage state found (tried: ${names.join(", ")})`,
      );
      this.triageStateIdCache = null;
      return null;
    }
    this.triageStateIdCache = chosen.id;
    return chosen.id;
  }

  private labelNameForEnvironment(environment: string): string {
    const prodLabel = process.env.LINEAR_LABEL_ENV_PROD || "env:prod";
    const devLabel = process.env.LINEAR_LABEL_ENV_DEV || "env:dev";
    return environment === "production" ? prodLabel : devLabel;
  }

  private async resolveLabelId(
    teamId: string,
    name: string,
  ): Promise<string | null> {
    const cacheKey = `${teamId}::${name}`;
    if (this.labelIdCache.has(cacheKey)) {
      return this.labelIdCache.get(cacheKey) ?? null;
    }
    const query = `query($teamId: ID!, $name: String!) {
      issueLabels(filter: { team: { id: { eq: $teamId } }, name: { eq: $name } }) {
        nodes { id name }
      }
    }`;
    const data = await this.graphql<{
      issueLabels: { nodes: Array<{ id: string; name: string }> };
    }>(query, { teamId, name });

    const node = data.issueLabels?.nodes?.[0];
    if (!node) {
      this.logger.warn(
        `Linear label '${name}' not found on team ${teamId}; skipping label`,
      );
      this.labelIdCache.set(cacheKey, null);
      return null;
    }
    this.labelIdCache.set(cacheKey, node.id);
    return node.id;
  }

  private buildDescription(input: CreateTicketInput): string {
    const header = [
      `**Source**: ${input.source}`,
      `**External ID**: ${input.externalId}`,
      `**Environment**: ${input.environment}`,
    ];
    if (input.severity) {
      header.push(`**Severity**: ${input.severity}`);
    }
    return `${header.join("\n")}\n\n${input.description}`;
  }

  private async graphql<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const apiKey = this.apiKey;
    let res: Response;
    try {
      res = await fetch(LINEAR_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      this.logger.error(`Linear GraphQL fetch failed: ${message}`);
      throw new BadGatewayException(`Linear GraphQL fetch failed: ${message}`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      this.logger.error(
        `Linear GraphQL HTTP ${res.status}: ${text.slice(0, 500)}`,
      );
      throw new BadGatewayException(`Linear GraphQL HTTP ${res.status}`);
    }

    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors && json.errors.length > 0) {
      const message = json.errors.map((e) => e.message).join("; ");
      this.logger.error(`Linear GraphQL errors: ${message}`);
      throw new BadGatewayException(`Linear GraphQL errors: ${message}`);
    }
    if (!json.data) {
      throw new BadGatewayException("Linear GraphQL returned no data");
    }
    return json.data;
  }
}
