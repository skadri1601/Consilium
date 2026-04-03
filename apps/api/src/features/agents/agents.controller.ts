import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AgentsService } from "./agents.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";

@ApiTags("agents")
@Controller("agents")
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new agent" })
  create(
    @Body() createAgentDto: CreateAgentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.agentsService.create(createAgentDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: "Get all agents" })
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.agentsService.findAll(user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get agent by ID" })
  findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserData) {
    return this.agentsService.findOne(id, user.userId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update agent" })
  update(
    @Param("id") id: string,
    @Body() updateAgentDto: UpdateAgentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.agentsService.update(id, updateAgentDto, user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete agent" })
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserData) {
    return this.agentsService.remove(id, user.userId);
  }
}
