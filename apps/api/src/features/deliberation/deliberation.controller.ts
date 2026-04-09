import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Sse,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Observable, interval } from "rxjs";
import { DeliberationService } from "./deliberation.service";
import { DeliberationSseService } from "./deliberation-sse.service";
import { CreateDeliberationDto } from "./dto/create-deliberation.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { RateLimit } from "../../shared/decorators/rate-limit.decorator";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";

@ApiTags("deliberation")
@Controller("deliberation")
export class DeliberationController {
  constructor(
    private readonly deliberationService: DeliberationService,
    private readonly sseService: DeliberationSseService,
  ) {}

  @Post()
  @UseGuards(ClerkAuthGuard, RateLimitGuard)
  @RateLimit(10, 60)
  @ApiOperation({ summary: "Start a new deliberation session" })
  @ApiResponse({ status: 201, description: "Deliberation session created" })
  async createDeliberation(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateDeliberationDto,
  ) {
    return this.deliberationService.createDeliberation(user.userId, dto);
  }

  @Post("red-team")
  @UseGuards(ClerkAuthGuard, RateLimitGuard)
  @RateLimit(10, 60)
  @ApiOperation({ summary: "Start a red team assessment" })
  @ApiResponse({ status: 201, description: "Red team assessment created" })
  async createRedTeam(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateDeliberationDto,
  ) {
    return this.deliberationService.createRedTeam(user.userId, dto);
  }

  @Post("blind-eval")
  @UseGuards(ClerkAuthGuard, RateLimitGuard)
  @RateLimit(10, 60)
  @ApiOperation({ summary: "Start a blind evaluation" })
  @ApiResponse({ status: 201, description: "Blind evaluation created" })
  async createBlindEval(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateDeliberationDto,
  ) {
    return this.deliberationService.createBlindEval(user.userId, dto);
  }

  @Get(":id")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Get deliberation result" })
  @ApiResponse({ status: 200, description: "Deliberation details" })
  async getDeliberation(
    @CurrentUser() user: CurrentUserData,
    @Param("id") id: string,
  ) {
    return this.deliberationService.getDeliberation(id, user.userId);
  }

  @Post(":id/cancel")
  @UseGuards(ClerkAuthGuard, RateLimitGuard)
  @RateLimit(10, 60)
  @ApiOperation({ summary: "Cancel a running deliberation" })
  @ApiResponse({ status: 200, description: "Deliberation cancelled" })
  async cancelDeliberation(
    @CurrentUser() user: CurrentUserData,
    @Param("id") id: string,
  ) {
    return this.deliberationService.cancelDeliberation(id, user.userId);
  }

  @Sse(":id/stream")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Stream deliberation progress with phase events" })
  @ApiResponse({
    status: 200,
    description: "SSE stream of deliberation events",
  })
  stream(
    @CurrentUser() user: CurrentUserData,
    @Param("id") id: string,
  ): Observable<{ data: string }> {
    const KEEPALIVE_MS = 15_000;
    const TIMEOUT_MS = 10 * 60 * 1000;

    return new Observable((subscriber) => {
      let done = false;

      const keepalive = interval(KEEPALIVE_MS).subscribe(() => {
        if (!done) {
          subscriber.next({ data: JSON.stringify({ event: "keepalive" }) });
        }
      });

      const timeout = setTimeout(() => {
        if (!done) {
          done = true;
          subscriber.next({
            data: JSON.stringify({
              event: "timeout",
              message: "Stream timed out",
            }),
          });
          subscriber.complete();
        }
      }, TIMEOUT_MS);

      const cleanup = () => {
        done = true;
        keepalive.unsubscribe();
        clearTimeout(timeout);
      };

      this.deliberationService
        .getDeliberation(id, user.userId)
        .then(() => {
          const proxyStream = this.sseService.proxyStream(id);
          proxyStream.subscribe({
            next: (event) => {
              if (!done) subscriber.next(event);
            },
            error: (error) => {
              cleanup();
              subscriber.error(error);
            },
            complete: () => {
              cleanup();
              subscriber.complete();
            },
          });
        })
        .catch((error) => {
          cleanup();
          subscriber.next({
            data: JSON.stringify({
              event: "error",
              message: error.message || "Deliberation not found",
            }),
          });
          subscriber.complete();
        });

      return cleanup;
    });
  }
}
