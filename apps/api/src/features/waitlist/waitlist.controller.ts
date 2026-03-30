import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { WaitlistService } from "./waitlist.service";
import { CreateWaitlistDto } from "./dto/create-waitlist.dto";

@ApiTags("waitlist")
@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Join the waitlist" })
  @ApiResponse({ status: 201, description: "Successfully joined waitlist" })
  @ApiResponse({ status: 400, description: "Invalid email address" })
  @ApiResponse({ status: 409, description: "Email already on waitlist" })
  async create(@Body() dto: CreateWaitlistDto) {
    return this.waitlistService.create(dto);
  }
}
