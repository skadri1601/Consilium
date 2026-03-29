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
import { PersonasService } from "./personas.service";
import { CreatePersonaDto } from "./dto/create-persona.dto";
import { UpdatePersonaDto } from "./dto/update-persona.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { CurrentUser, CurrentUserData } from "../auth/decorators/current-user.decorator";

@ApiTags("personas")
@Controller("personas")
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  @ApiOperation({ summary: "Create a new agent persona" })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreatePersonaDto,
  ) {
    return this.personasService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all user's personas" })
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.personasService.findAll(user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific persona" })
  async findOne(@CurrentUser() user: CurrentUserData, @Param("id") id: string) {
    return this.personasService.findOne(id, user.userId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a persona" })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param("id") id: string,
    @Body() dto: UpdatePersonaDto,
  ) {
    return this.personasService.update(id, user.userId, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a persona" })
  async remove(@CurrentUser() user: CurrentUserData, @Param("id") id: string) {
    return this.personasService.remove(id, user.userId);
  }
}

