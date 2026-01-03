import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { CurrentUser, CurrentUserData } from "../auth/decorators/current-user.decorator";

@ApiTags("analytics")
@Controller("analytics")
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get usage statistics" })
  getStats(@CurrentUser() user: CurrentUserData) {
    return this.analyticsService.getStats(user.userId);
  }

  @Get("usage")
  @ApiOperation({ summary: "Get usage history" })
  getUsageHistory(
    @Query("days") days: number = 30,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.analyticsService.getUsageHistory(user.userId, days);
  }

  @Get("costs")
  @ApiOperation({ summary: "Get cost breakdown by model" })
  getCostsByModel(@CurrentUser() user: CurrentUserData) {
    return this.analyticsService.getCostsByModel(user.userId);
  }
}
