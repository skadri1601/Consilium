import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ConversationsService } from "./conversations.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";

@ApiTags("conversations")
@Controller("conversations")
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new conversation" })
  create(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.conversationsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: "Get all conversations" })
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.conversationsService.findAll(user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get conversation by ID" })
  findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserData) {
    return this.conversationsService.findOne(id, user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete conversation" })
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserData) {
    return this.conversationsService.remove(id, user.userId);
  }
}
