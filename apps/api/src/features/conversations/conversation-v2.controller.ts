import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ConversationV2Service } from "./conversation-v2.service";
import { CreateConversationV2Dto, AddDebateToConversationDto } from "./dto/create-conversation-v2.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { CurrentUser, CurrentUserData } from "../auth/decorators/current-user.decorator";

@ApiTags("conversations-v2")
@Controller("v2/conversations")
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class ConversationV2Controller {
  constructor(private readonly conversationV2Service: ConversationV2Service) {}

  @Post()
  @ApiOperation({ summary: "Create a new conversation" })
  @ApiResponse({ status: 201, description: "Conversation created" })
  create(@Body() dto: CreateConversationV2Dto, @CurrentUser() user: CurrentUserData): Promise<any> {
    return this.conversationV2Service.create(user.userId, dto.title);
  }

  @Get()
  @ApiOperation({ summary: "List conversations" })
  @ApiResponse({ status: 200, description: "List of conversations" })
  list(
    @CurrentUser() user: CurrentUserData,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<any[]> {
    return this.conversationV2Service.list(
      user.userId,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get conversation details" })
  @ApiResponse({ status: 200, description: "Conversation details" })
  get(@Param("id") id: string, @CurrentUser() user: CurrentUserData): Promise<any> {
    return this.conversationV2Service.get(id, user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft delete a conversation" })
  @ApiResponse({ status: 200, description: "Conversation deleted" })
  delete(@Param("id") id: string, @CurrentUser() user: CurrentUserData): Promise<any> {
    return this.conversationV2Service.delete(id, user.userId);
  }

  @Post(":id/debates")
  @ApiOperation({ summary: "Link a debate to a conversation" })
  @ApiResponse({ status: 200, description: "Debate linked" })
  addDebate(
    @Param("id") id: string,
    @Body() dto: AddDebateToConversationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<any> {
    return this.conversationV2Service.addDebate(id, dto.debateId, user.userId);
  }
}
