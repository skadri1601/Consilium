import {
  BadGatewayException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { LinearTicketService } from "./linear-ticket.service";

type FetchMock = jest.SpyInstance<Promise<Response>, Parameters<typeof fetch>>;

interface MockResponseInit {
  ok?: boolean;
  status?: number;
  body: unknown;
  text?: string;
}

function mockResponse(init: MockResponseInit): Response {
  const ok = init.ok ?? true;
  const status = init.status ?? (ok ? 200 : 500);
  return {
    ok,
    status,
    json: async () => init.body,
    text: async () => init.text ?? JSON.stringify(init.body),
  } as Response;
}

function queueResponses(fetchMock: FetchMock, responses: MockResponseInit[]) {
  for (const r of responses) {
    fetchMock.mockResolvedValueOnce(mockResponse(r));
  }
}

function lastBody(fetchMock: FetchMock, callIndex: number) {
  const call = fetchMock.mock.calls[callIndex];
  const init = call[1] as RequestInit;
  return JSON.parse(init.body as string) as {
    query: string;
    variables: Record<string, unknown>;
  };
}

describe("LinearTicketService", () => {
  let fetchMock: FetchMock;
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      LINEAR_API_KEY: "lin_api_test_key",
      LINEAR_TEAM_ID: "team-uuid-cached",
    };
    fetchMock = jest.spyOn(global, "fetch") as FetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  describe("findByAttachmentUrl", () => {
    it("returns null when GraphQL returns empty nodes", async () => {
      queueResponses(fetchMock, [
        {
          body: { data: { attachmentsForURL: { nodes: [] } } },
        },
      ]);
      const svc = new LinearTicketService();
      const result = await svc.findByAttachmentUrl(
        "https://sentry.io/issue/ABC-1",
      );
      expect(result).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const sent = lastBody(fetchMock, 0);
      expect(sent.query).toContain("attachmentsForURL");
      expect(sent.variables).toEqual({
        url: "https://sentry.io/issue/ABC-1",
      });
      const headers = (fetchMock.mock.calls[0][1] as RequestInit)
        .headers as Record<string, string>;
      expect(headers.Authorization).toBe("lin_api_test_key");
    });

    it("returns ticket when GraphQL returns a match", async () => {
      queueResponses(fetchMock, [
        {
          body: {
            data: {
              attachmentsForURL: {
                nodes: [
                  {
                    id: "att-1",
                    issue: {
                      id: "iss-1",
                      identifier: "MYC-42",
                      url: "https://linear.app/myc/issue/MYC-42",
                    },
                  },
                ],
              },
            },
          },
        },
      ]);
      const svc = new LinearTicketService();
      const result = await svc.findByAttachmentUrl(
        "https://sentry.io/issue/ABC-1",
      );
      expect(result).toEqual({
        issueId: "iss-1",
        identifier: "MYC-42",
        url: "https://linear.app/myc/issue/MYC-42",
      });
    });
  });

  describe("createTicket", () => {
    const baseInput = {
      source: "sentry" as const,
      title: "TypeError: undefined is not a function",
      description: "Stack trace here",
      attachmentUrl: "https://sentry.io/issue/ABC-1",
      attachmentTitle: "Sentry: TypeError",
      environment: "production",
      externalId: "ABC-1",
      severity: "error",
    };

    it("looks up state, label, creates issue, then attachment in order", async () => {
      delete process.env.LINEAR_TEAM_ID;
      process.env.LINEAR_TICKET_PREFIX = "MYC";
      queueResponses(fetchMock, [
        {
          body: {
            data: {
              teams: { nodes: [{ id: "team-uuid", key: "MYC" }] },
            },
          },
        },
        {
          body: {
            data: {
              workflowStates: {
                nodes: [{ id: "state-triage", name: "Triage" }],
              },
            },
          },
        },
        {
          body: {
            data: {
              issueLabels: {
                nodes: [{ id: "label-prod", name: "env:prod" }],
              },
            },
          },
        },
        {
          body: {
            data: {
              issueCreate: {
                success: true,
                issue: {
                  id: "iss-new",
                  identifier: "MYC-101",
                  url: "https://linear.app/myc/issue/MYC-101",
                },
              },
            },
          },
        },
        {
          body: {
            data: {
              attachmentCreate: {
                success: true,
                attachment: { id: "att-new" },
              },
            },
          },
        },
      ]);

      const svc = new LinearTicketService();
      const result = await svc.createTicket(baseInput);
      expect(result.identifier).toBe("MYC-101");
      expect(fetchMock).toHaveBeenCalledTimes(5);

      expect(lastBody(fetchMock, 0).query).toContain("teams(filter");
      expect(lastBody(fetchMock, 1).query).toContain("workflowStates");
      expect(lastBody(fetchMock, 2).query).toContain("issueLabels");

      const issueCreateBody = lastBody(fetchMock, 3);
      expect(issueCreateBody.query).toContain("issueCreate");
      const issueInput = issueCreateBody.variables.input as Record<
        string,
        unknown
      >;
      expect(issueInput.teamId).toBe("team-uuid");
      expect(issueInput.title).toBe(baseInput.title);
      expect(issueInput.stateId).toBe("state-triage");
      expect(issueInput.labelIds).toEqual(["label-prod"]);
      expect(issueInput.description).toContain("**Source**: sentry");
      expect(issueInput.description).toContain("**External ID**: ABC-1");
      expect(issueInput.description).toContain("**Environment**: production");
      expect(issueInput.description).toContain("**Severity**: error");
      expect(issueInput.description).toContain("Stack trace here");

      const attachmentBody = lastBody(fetchMock, 4);
      expect(attachmentBody.query).toContain("attachmentCreate");
      expect(attachmentBody.variables.input).toEqual({
        issueId: "iss-new",
        url: baseInput.attachmentUrl,
        title: baseInput.attachmentTitle,
      });
    });

    it("skips label and logs warning when label lookup returns empty", async () => {
      const warnSpy = jest
        .spyOn((await import("@nestjs/common")).Logger.prototype, "warn")
        .mockImplementation(() => undefined);

      queueResponses(fetchMock, [
        {
          body: {
            data: {
              workflowStates: {
                nodes: [{ id: "state-triage", name: "Triage" }],
              },
            },
          },
        },
        {
          body: { data: { issueLabels: { nodes: [] } } },
        },
        {
          body: {
            data: {
              issueCreate: {
                success: true,
                issue: {
                  id: "iss-new",
                  identifier: "MYC-102",
                  url: "https://linear.app/myc/issue/MYC-102",
                },
              },
            },
          },
        },
        {
          body: {
            data: {
              attachmentCreate: {
                success: true,
                attachment: { id: "att-new" },
              },
            },
          },
        },
      ]);

      const svc = new LinearTicketService();
      await svc.createTicket({ ...baseInput, environment: "development" });

      const issueCreateBody = lastBody(fetchMock, 2);
      const issueInput = issueCreateBody.variables.input as Record<
        string,
        unknown
      >;
      expect(issueInput.labelIds).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Linear label 'env:dev' not found"),
      );
    });
  });

  describe("addRecurrenceComment", () => {
    it("posts a commentCreate mutation with formatted body", async () => {
      queueResponses(fetchMock, [
        {
          body: {
            data: {
              commentCreate: {
                success: true,
                comment: { id: "comment-1" },
              },
            },
          },
        },
      ]);
      const svc = new LinearTicketService();
      await svc.addRecurrenceComment("iss-1", "sentry", {
        count: "5",
        lastSeen: "2026-05-22T10:00:00Z",
      });

      const sent = lastBody(fetchMock, 0);
      expect(sent.query).toContain("commentCreate");
      const input = sent.variables.input as { issueId: string; body: string };
      expect(input.issueId).toBe("iss-1");
      expect(input.body).toBe(
        [
          "**Recurrence from sentry**",
          "- count: 5",
          "- lastSeen: 2026-05-22T10:00:00Z",
        ].join("\n"),
      );
    });
  });

  describe("configuration errors", () => {
    it("throws ServiceUnavailableException when LINEAR_API_KEY is missing", async () => {
      delete process.env.LINEAR_API_KEY;
      const svc = new LinearTicketService();
      await expect(
        svc.findByAttachmentUrl("https://example.com"),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("throws BadGatewayException when GraphQL returns errors", async () => {
      queueResponses(fetchMock, [
        {
          body: {
            errors: [{ message: "Invalid API key" }],
          },
        },
      ]);
      const svc = new LinearTicketService();
      await expect(
        svc.findByAttachmentUrl("https://example.com"),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it("throws BadGatewayException on non-2xx HTTP", async () => {
      queueResponses(fetchMock, [
        {
          ok: false,
          status: 503,
          body: {},
          text: "service down",
        },
      ]);
      const svc = new LinearTicketService();
      await expect(
        svc.findByAttachmentUrl("https://example.com"),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });
});
