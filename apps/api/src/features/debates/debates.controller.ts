import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Sse,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DebatesService } from "./debates.service";
import { CreateDebateDto } from "./dto/create-debate.dto";
import { EstimateDebateDto, EstimateResponseDto } from "./dto/estimate-debate.dto";
import { DebateResponseDto, DebateDetailDto } from "./dto/debate-response.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { RateLimit } from "../../shared/decorators/rate-limit.decorator";
import { CurrentUser, CurrentUserData } from "../auth/decorators/current-user.decorator";
import { Observable } from "rxjs";
import { SseProxyService } from "./sse-proxy.service";

@ApiTags("debates")
@Controller("debates")
export class DebatesController {
  constructor(
    private readonly debatesService: DebatesService,
    private readonly sseProxy: SseProxyService,
  ) {}

  @Post("estimate")
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60)
  @ApiOperation({ summary: "Estimate cost of a debate session" })
  @ApiResponse({ status: 200, description: "Cost estimate", type: EstimateResponseDto })
  estimateCost(@Body() dto: EstimateDebateDto): EstimateResponseDto {
    return this.debatesService.estimateCost(dto.topic, dto.models, dto.mode || "council");
  }

  @Post()
  @UseGuards(ClerkAuthGuard, RateLimitGuard)
  @RateLimit(10, 60)
  @ApiOperation({ summary: "Start a new debate session" })
  @ApiResponse({ status: 201, description: "Debate session created", type: DebateResponseDto })
  async createDebate(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateDebateDto,
  ) {
    return this.debatesService.createDebate(user.userId, dto);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "List user's debate sessions" })
  @ApiResponse({ status: 200, description: "List of debate sessions", type: [DebateResponseDto] })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("search") search?: string,
  ) {
    return this.debatesService.findAll(
      user.userId,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
      search,
    );
  }

  @Get(":id/conversation")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Get all debates in the same conversation" })
  @ApiResponse({ status: 200, description: "List of debates in conversation" })
  async findConversationDebates(@CurrentUser() user: CurrentUserData, @Param("id") id: string) {
    const debate = await this.debatesService.findOne(id, user.userId);
    if (!debate.conversationId) {
      return [debate];
    }
    return this.debatesService.findConversationDebates(debate.conversationId, user.userId);
  }

  @Get(":id")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Get debate session details" })
  @ApiResponse({ status: 200, description: "Debate session details", type: DebateDetailDto })
  async findOne(@CurrentUser() user: CurrentUserData, @Param("id") id: string) {
    return this.debatesService.findOne(id, user.userId);
  }

  @Patch(":id")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Update a debate session (rename/archive)" })
  @ApiResponse({ status: 200, description: "Debate session updated" })
  async updateDebate(
    @CurrentUser() user: CurrentUserData,
    @Param("id") id: string,
    @Body() body: { topic?: string; archived?: boolean },
  ) {
    if (body.topic !== undefined) {
      return this.debatesService.renameDebate(id, user.userId, body.topic);
    }
    if (body.archived !== undefined) {
      return this.debatesService.archiveDebate(id, user.userId, body.archived);
    }
    return this.debatesService.findOne(id, user.userId);
  }

  @Delete(":id")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Delete a debate session" })
  @ApiResponse({ status: 200, description: "Debate session deleted" })
  async deleteDebate(@CurrentUser() user: CurrentUserData, @Param("id") id: string) {
    return this.debatesService.deleteDebate(id, user.userId);
  }

  @Post(":id/cancel")
  @UseGuards(ClerkAuthGuard, RateLimitGuard)
  @RateLimit(10, 60)
  @ApiOperation({ summary: "Cancel an active debate session" })
  @ApiResponse({ status: 200, description: "Debate session cancelled" })
  async cancelDebate(@CurrentUser() user: CurrentUserData, @Param("id") id: string) {
    return this.debatesService.cancelDebate(id, user.userId);
  }

  @Post(":id/retry")
  @UseGuards(ClerkAuthGuard, RateLimitGuard)
  @RateLimit(5, 60)
  @ApiOperation({ summary: "Retry a failed debate session" })
  @ApiResponse({ status: 200, description: "Debate session retried", type: DebateResponseDto })
  async retryDebate(@CurrentUser() user: CurrentUserData, @Param("id") id: string) {
    return this.debatesService.retryDebate(id, user.userId);
  }

  @Sse(":id/stream")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Stream debate session progress" })
  @ApiResponse({ status: 200, description: "SSE stream of debate events" })
  stream(@CurrentUser() user: CurrentUserData, @Param("id") id: string): Observable<{ data: string }> {
    return new Observable((subscriber) => {
      this.debatesService
        .findOne(id, user.userId)
        .then(() => {
          const proxyStream = this.sseProxy.proxyStream(id);
          proxyStream.subscribe({
            next: (event) => subscriber.next(event),
            error: (error) => subscriber.error(error),
            complete: () => subscriber.complete(),
          });
        })
        .catch((error) => {
          subscriber.next({
            data: JSON.stringify({
              event: "error",
              message: error.message || "Debate not found",
            }),
          });
          subscriber.complete();
        });
    });
  }
}

