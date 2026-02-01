import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Sse,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DebatesService } from "./debates.service";
import { CreateDebateDto } from "./dto/create-debate.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Observable } from "rxjs";
import { SseProxyService } from "./sse-proxy.service";

@ApiTags("debates")
@Controller("debates")
@UseGuards(ClerkAuthGuard)
export class DebatesController {
  constructor(
    private readonly debatesService: DebatesService,
    private readonly sseProxy: SseProxyService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Start a new debate session" })
  @ApiResponse({ status: 201, description: "Debate session created" })
  async createDebate(
    @CurrentUser() user: any,
    @Body() dto: CreateDebateDto,
  ) {
    return this.debatesService.createDebate(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List user's debate sessions" })
  @ApiResponse({ status: 200, description: "List of debate sessions" })
  async findAll(
    @CurrentUser() user: any,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.debatesService.findAll(
      user.userId,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get debate session details" })
  @ApiResponse({ status: 200, description: "Debate session details" })
  async findOne(@CurrentUser() user: any, @Param("id") id: string) {
    return this.debatesService.findOne(id, user.userId);
  }

  @Sse(":id/stream")
  @ApiOperation({ summary: "Stream debate session progress" })
  @ApiResponse({ status: 200, description: "SSE stream of debate events" })
  stream(@CurrentUser() user: any, @Param("id") id: string): Observable<MessageEvent> {
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
          // Return error as SSE event
          subscriber.next({
            data: JSON.stringify({
              event: "error",
              message: error.message || "Debate not found",
            }),
          } as MessageEvent);
          subscriber.complete();
        });
    });
  }
}

