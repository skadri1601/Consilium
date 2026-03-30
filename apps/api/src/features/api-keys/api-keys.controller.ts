import { Controller, Get, Put, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ApiKeysService } from "./api-keys.service";
import { UpdateApiKeysDto } from "./dto/update-api-keys.dto";
import { TestApiKeyDto } from "./dto/test-api-key.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { RateLimit } from "../../shared/decorators/rate-limit.decorator";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";
import { CliTokenService } from "../auth/services/cli-token.service";

@ApiTags("api-keys")
@Controller("api-keys")
@UseGuards(ClerkAuthGuard)
export class ApiKeysController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly cliTokenService: CliTokenService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get user's API keys (masked)" })
  @ApiResponse({ status: 200, description: "API keys retrieved successfully" })
  async getApiKeys(@CurrentUser() user: CurrentUserData) {
    return this.apiKeysService.getApiKeys(user.userId);
  }

  @Put()
  @ApiOperation({ summary: "Update user's API keys" })
  @ApiResponse({ status: 200, description: "API keys updated successfully" })
  async updateApiKeys(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateApiKeysDto,
  ) {
    return this.apiKeysService.updateApiKeys(user.userId, dto);
  }

  @Post("test")
  @UseGuards(RateLimitGuard)
  @RateLimit(20, 60)
  @ApiOperation({ summary: "Test an API key" })
  @ApiResponse({ status: 200, description: "API key test result" })
  async testApiKey(@Body() dto: TestApiKeyDto) {
    return this.apiKeysService.testApiKey(dto);
  }

  @Post("cli-token")
  @ApiOperation({
    summary: "Generate a CLI token (long-lived, for consilium CLI)",
  })
  @ApiResponse({
    status: 201,
    description:
      "CLI token generated; copy and run: consilium config set apiKey <token>",
  })
  async generateCliToken(@CurrentUser() user: CurrentUserData) {
    const { token } = await this.cliTokenService.generate(user.userId);
    return { token };
  }
}
