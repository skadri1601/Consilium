import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness check" })
  ready() {
    return {
      status: "ready",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("live")
  @ApiOperation({ summary: "Liveness check" })
  live() {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  }
}
