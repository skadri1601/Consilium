import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  HealthCheckService,
  HealthCheck,
  HealthIndicator,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
import { PrismaService } from "./shared/database/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController extends HealthIndicator {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private prismaService: PrismaService,
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
}
