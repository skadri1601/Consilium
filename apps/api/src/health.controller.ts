import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  HealthCheckService,
  HealthCheck,
  HealthIndicator,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { PrismaService } from "./shared/database/prisma.service";

type DiagnosticStatus = "ok" | "degraded" | "down" | "skipped";

interface DiagnosticCheck {
  name: string;
  status: DiagnosticStatus;
  durationMs: number;
  detail?: string;
}

@ApiTags("health")
@Controller("health")
export class HealthController extends HealthIndicator {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private prismaService: PrismaService,
    private configService: ConfigService,
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
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
      () => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS("memory_rss", 300 * 1024 * 1024), // 300MB
    ]);
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
        error: error instanceof Error ? error.message : String(error),
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

  @Get("diagnostics")
  @ApiOperation({
    summary:
      "Doctor-style diagnostics: probes each integration (db, redis, agents, providers, sentry) and returns a per-check report.",
  })
  @ApiResponse({
    status: 200,
    description:
      "Diagnostic report. Returns 200 even when checks are degraded - clients inspect the per-check status.",
  })
  async diagnostics() {
    const checks: DiagnosticCheck[] = [];
    checks.push(await this.checkDatabase());
    checks.push(await this.checkRedis());
    checks.push(await this.checkAgentsService());
    checks.push(this.checkProviderKeys());
    checks.push(this.checkSentry());

    const overall = HealthController.aggregate(checks);
    return {
      status: overall,
      timestamp: new Date().toISOString(),
      service: "consilium-api",
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      checks,
    };
  }

  private async checkDatabase(): Promise<DiagnosticCheck> {
    const started = Date.now();
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return {
        name: "database",
        status: "ok",
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        name: "database",
        status: "down",
        durationMs: Date.now() - started,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkRedis(): Promise<DiagnosticCheck> {
    const started = Date.now();
    try {
      const result = await Promise.race([
        this.redis.ping(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("redis ping timeout")), 1500),
        ),
      ]);
      const ok = typeof result === "string" && result.toUpperCase() === "PONG";
      return {
        name: "redis",
        status: ok ? "ok" : "degraded",
        durationMs: Date.now() - started,
        detail: ok ? undefined : `unexpected ping response: ${result}`,
      };
    } catch (error) {
      return {
        name: "redis",
        status: "down",
        durationMs: Date.now() - started,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkAgentsService(): Promise<DiagnosticCheck> {
    const started = Date.now();
    const baseUrl =
      this.configService.get<string>("AI_WORKERS_URL") ||
      process.env.AI_WORKERS_URL;
    if (!baseUrl) {
      return {
        name: "agents",
        status: "skipped",
        durationMs: 0,
        detail: "AI_WORKERS_URL not configured",
      };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return {
        name: "agents",
        status: response.ok ? "ok" : "degraded",
        durationMs: Date.now() - started,
        detail: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        name: "agents",
        status: "down",
        durationMs: Date.now() - started,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private checkProviderKeys(): DiagnosticCheck {
    const started = Date.now();
    const platformKeys = [
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "GOOGLE_API_KEY",
      "GROQ_API_KEY",
      "XAI_API_KEY",
      "MOONSHOT_API_KEY",
      "OPENROUTER_API_KEY",
    ];
    const fallbackKeys = [
      "CONSILIUM_FREE_TIER_GROQ_KEY",
      "CONSILIUM_FREE_TIER_OPENROUTER_KEY",
    ];
    const presentPlatform = platformKeys.filter((k) => !!process.env[k]);
    const presentFallback = fallbackKeys.filter((k) => !!process.env[k]);
    const status: DiagnosticStatus =
      presentPlatform.length + presentFallback.length === 0 ? "degraded" : "ok";
    return {
      name: "providers",
      status,
      durationMs: Date.now() - started,
      detail: `platform=${presentPlatform.length}/${platformKeys.length} fallback=${presentFallback.length}/${fallbackKeys.length}`,
    };
  }

  private checkSentry(): DiagnosticCheck {
    const dsn = process.env.SENTRY_DSN;
    return {
      name: "sentry",
      status: dsn ? "ok" : "skipped",
      durationMs: 0,
      detail: dsn ? undefined : "SENTRY_DSN not configured",
    };
  }

  private static aggregate(checks: DiagnosticCheck[]): DiagnosticStatus {
    if (checks.some((c) => c.status === "down")) return "down";
    if (checks.some((c) => c.status === "degraded")) return "degraded";
    return "ok";
  }
}
