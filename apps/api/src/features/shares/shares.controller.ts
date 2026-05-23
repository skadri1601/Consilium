import {
  Body,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  HttpCode,
  Inject,
  Injectable,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SharesService } from "./shares.service";
import { CreateShareDto } from "./dto/create-share.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";

@Injectable()
export class OptionalClerkAuthGuard implements CanActivate {
  constructor(@Inject(ClerkAuthGuard) private readonly inner: ClerkAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers?.authorization;
    if (!auth) return true;
    await this.inner.canActivate(context);
    return true;
  }
}

@ApiTags("shares")
@Controller("sessions")
export class SessionSharesController {
  constructor(private readonly shares: SharesService) {}

  @Post(":id/share")
  @HttpCode(201)
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a shareable link for a session" })
  async create(
    @Param("id") sessionId: string,
    @Body() dto: CreateShareDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.shares.createShare(user.userId, sessionId, dto);
  }

  @Delete(":id/share/:shareId")
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a session share" })
  async remove(
    @Param("id") _sessionId: string,
    @Param("shareId") shareId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.shares.deleteShare(user.userId, shareId);
    return { success: true };
  }
}

@ApiTags("shares")
@Controller("shares")
export class SharesController {
  constructor(private readonly shares: SharesService) {}

  @Get(":token")
  @UseGuards(OptionalClerkAuthGuard)
  @ApiOperation({
    summary: "Get a shared session by token (public or owner-only)",
  })
  async get(
    @Param("token") token: string,
    @Req() req: { user?: CurrentUserData },
  ) {
    const requesterId = req?.user?.userId;
    return this.shares.getShare(token, requesterId);
  }
}
