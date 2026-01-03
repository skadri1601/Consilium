import { Controller, Post, Body, UseGuards, Sse, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { CouncilService } from "./council.service";
import { CouncilQueryDto } from "./dto/council-query.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";

@ApiTags("council")
@Controller("council")
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class CouncilController {
  constructor(private readonly councilService: CouncilService) {}

  @Post("query")
  @ApiOperation({ summary: "Send query to AI council" })
  query(@Body() dto: CouncilQueryDto, @CurrentUser() user: CurrentUserData) {
    return this.councilService.query(dto, user.userId);
  }

  @Sse("stream/:sessionId")
  @ApiOperation({ summary: "Stream council responses via SSE" })
  stream(@Param("sessionId") sessionId: string): Observable<MessageEvent> {
    return this.councilService.streamResponses(sessionId);
  }
}

interface MessageEvent {
  data: string;
}
