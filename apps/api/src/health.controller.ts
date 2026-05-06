import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  HealthCheckService,
  HealthCheck,
  HealthIndicator,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { PrismaService } from "./shared/database/prisma.service";

interface DiagnosticCheck {
  name: string;
  status: "up" | "down" | "degraded";
  latencyMs: number;
  detail?: string;
}

@ApiTags("health")
@Controller("health")
export class HealthController extends HealthIndicator {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private prismaService: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super();
  }

  @Get()
  @ApiOperation({ summary: "Comprehensive health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  @ApiResponse({ status: 503, description: "Service is unhealthy" })
  @HealthCheck()
  check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prismaService.$queryRaw`SELECT 1`;
          return this.getStatus("database", true, { status: "up" });
        } catch (error) {
          return this.getStatus("database", false, {
            status: "down",
            error: error.message,
          });
        }
      },
      () => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024),
      () => this.memory.checkRSS("memory_rss", 300 * 1024 * 1024),
    ]);
  }

  @Get("diagnostics")
  @ApiOperation({ summary: "Deep diagnostics check for all connected services" })
  @ApiResponse({ status: 200, description: "Diagnostics report" })
  async diagnostics() {
    const checks: DiagnosticCheck[] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAgentsService(),
      this.checkSentry(),
    ]);

    const allUp = checks.every((c) => c.status === "up");
    const anyDown = checks.some((c) => c.status === "down");

    return {
      status: anyDown ? "unhealthy" : allUp ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      checks,
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss,
      },
    };
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness check for container orchestration" })
  @ApiResponse({
    status: 200,
    description: "Service is ready to accept traffic",
  })
  async ready() {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return {
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: true,
        },
      };
    } catch (error) {
      return {
        status: "not_ready",
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          database: false,
        },
      };
    }
  }

  @Get("live")
  @ApiOperation({ summary: "Liveness check for container orchestration" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  live() {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "0.1.0",
    };
  }

  @Get("info")
  @ApiOperation({ summary: "Service information" })
  @ApiResponse({ status: 200, description: "Service information" })
  info() {
    return {
      service: "consilium-api",
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss,
      },
      nodejs: process.version,
    };
  }

  private async checkDatabase(): Promise<DiagnosticCheck> {
    const start = Date.now();
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return { name: "database", status: "up", latencyMs: Date.now() - start };
    } catch (error) {
      return {
        name: "database",
        status: "down",
        latencyMs: Date.now() - start,
        detail: error.message,
      };
    }
  }

  private async checkRedis(): Promise<DiagnosticCheck> {
    const start = Date.now();
    try {
      const pong = await this.redis.ping();
      return {
        name: "redis",
        status: pong === "PONG" ? "up" : "degraded",
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: "redis",
        status: "down",
        latencyMs: Date.now() - start,
        detail: error.message,
      };
    }
  }

  private async checkAgentsService(): Promise<DiagnosticCheck> {
    const agentsUrl = process.env.AGENTS_URL || "http://localhost:8000";
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${agentsUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return {
        name: "agents",
        status: response.ok ? "up" : "degraded",
        latencyMs: Date.now() - start,
        detail: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        name: "agents",
        status: "down",
        latencyMs: Date.now() - start,
        detail: error.message,
      };
    }
  }

  private async checkSentry(): Promise<DiagnosticCheck> {
    const hasDsn = !!process.env.SENTRY_DSN;
    return {
      name: "sentry",
      status: hasDsn ? "up" : "degraded",
      latencyMs: 0,
      detail: hasDsn ? undefined : "SENTRY_DSN not configured",
    };
  }
}
