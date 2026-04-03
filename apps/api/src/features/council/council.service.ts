import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";
import { PrismaService } from "../../shared/database/prisma.service";
import { CouncilQueryDto } from "./dto/council-query.dto";

interface AgentResponse {
  agentId: string;
  content: string;
  tokensUsed: number;
  latencyMs: number;
}

@Injectable()
export class CouncilService {
  private responseStreams = new Map<string, Subject<AgentResponse>>();

  constructor(private prisma: PrismaService) {}

  async query(dto: CouncilQueryDto, userId: string) {
    const session = await this.prisma.councilSession.create({
      data: {
        query: dto.query,
        mode: dto.mode || "visible",
        tenantId: userId,
      },
    });

    this.responseStreams.set(session.id, new Subject<AgentResponse>());

    return {
      sessionId: session.id,
      query: dto.query,
      agents: dto.agents,
      mode: dto.mode,
      status: "processing",
    };
  }

  streamResponses(sessionId: string): Observable<any> {
    const subject = this.responseStreams.get(sessionId);

    if (!subject) {
      return new Observable((subscriber) => {
        subscriber.next({
          data: JSON.stringify({ error: "Session not found" }),
        });
        subscriber.complete();
      });
    }

    return new Observable((subscriber) => {
      const subscription = subject.subscribe({
        next: (response) => {
          subscriber.next({ data: JSON.stringify(response) });
        },
        complete: () => {
          subscriber.complete();
          this.responseStreams.delete(sessionId);
        },
        error: (error) => {
          subscriber.error(error);
          this.responseStreams.delete(sessionId);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  emitResponse(sessionId: string, response: AgentResponse) {
    const subject = this.responseStreams.get(sessionId);
    if (subject) {
      subject.next(response);
    }
  }

  completeSession(sessionId: string) {
    const subject = this.responseStreams.get(sessionId);
    if (subject) {
      subject.complete();
    }
  }
}
