import { IsString, IsOptional, IsBoolean, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAgentDto {
  @ApiProperty({ example: "GPT-4o-mini" })
  @IsString()
  name: string;

  @ApiProperty({ example: "openai", enum: ["openai", "anthropic", "google", "xai"] })
  @IsString()
  @IsIn(["openai", "anthropic", "google", "xai"])
  provider: string;

  @ApiProperty({ example: "gpt-4o-mini" })
  @IsString()
  modelId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
