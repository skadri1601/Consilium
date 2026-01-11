import { Controller, Get, Put, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ApiKeysService } from "./api-keys.service";
import { UpdateApiKeysDto } from "./dto/update-api-keys.dto";
import { TestApiKeyDto } from "./dto/test-api-key.dto";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("api-keys")
@Controller("api-keys")
@UseGuards(ClerkAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: "Get user's API keys (masked)" })
  @ApiResponse({ status: 200, description: "API keys retrieved successfully" })
  async getApiKeys(@CurrentUser() user: any) {
    return this.apiKeysService.getApiKeys(user.userId);
  }

  @Put()
  @ApiOperation({ summary: "Update user's API keys" })
  @ApiResponse({ status: 200, description: "API keys updated successfully" })
  async updateApiKeys(@CurrentUser() user: any, @Body() dto: UpdateApiKeysDto) {
    return this.apiKeysService.updateApiKeys(user.userId, dto);
  }

  @Post("test")
  @ApiOperation({ summary: "Test an API key" })
  @ApiResponse({ status: 200, description: "API key test result" })
  async testApiKey(@Body() dto: TestApiKeyDto) {
    return this.apiKeysService.testApiKey(dto);
  }
}

