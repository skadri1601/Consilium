import { IsEmail, IsOptional, IsString, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateWaitlistDto {
  @ApiProperty({ description: "Email address", example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Source of signup", example: "landing_page" })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: "Additional metadata", example: { referrer: "google" } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

