import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

export type AuthEvent =
  | "login_success"
  | "login_failed"
  | "logout"
  | "session_created"
  | "session_refreshed"
  | "session_revoked"
  | "password_changed"
  | "email_changed"
  | "mfa_enabled"
  | "mfa_disabled"
  | "ip_blocked"
  | "geo_blocked"
  | "suspicious_activity";

export type Severity = "low" | "medium" | "high" | "critical";

interface LogMetadata {
  [key: string]: any;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(private prisma: PrismaService) {}

  async log(
    event: AuthEvent,
    options: {
      userId?: string;
      ip?: string;
      userAgent?: string;
      metadata?: LogMetadata;
      severity?: Severity;
    },
  ) {
    try {
      await this.prisma.authLog.create({
        data: {
          event,
          userId: options.userId,
          ip: options.ip,
          userAgent: options.userAgent,
          metadata: options.metadata || {},
          severity: options.severity || this.getDefaultSeverity(event),
        },
      });
    } catch (error) {
      this.logger.error("Failed to write audit log:", error);
    }
  }

  private getDefaultSeverity(event: AuthEvent): Severity {
    const severityMap: Record<AuthEvent, Severity> = {
      login_success: "low",
      login_failed: "medium",
      logout: "low",
      session_created: "low",
      session_refreshed: "low",
      session_revoked: "medium",
      password_changed: "high",
      email_changed: "high",
      mfa_enabled: "medium",
      mfa_disabled: "high",
      ip_blocked: "high",
      geo_blocked: "medium",
      suspicious_activity: "critical",
    };

    return severityMap[event] || "low";
  }

  async getLogs(
    filters: {
      userId?: string;
      event?: AuthEvent;
      severity?: Severity;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100,
  ): Promise<any[]> {
    return this.prisma.authLog.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.event && { event: filters.event }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.startDate || filters.endDate
          ? {
              createdAt: {
                ...(filters.startDate && { gte: filters.startDate }),
                ...(filters.endDate && { lte: filters.endDate }),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
