import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";

@ApiTags("users")
@Controller("users")
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  getProfile(@CurrentUser() user: CurrentUserData) {
    return this.usersService.findByClerkId(user.userId);
  }

  @Put("me")
  @ApiOperation({ summary: "Update current user profile" })
  updateProfile(
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.usersService.update(user.userId, dto);
  }
}
