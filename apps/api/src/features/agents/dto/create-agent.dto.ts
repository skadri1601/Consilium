import { IsString, IsOptional, IsBoolean, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAgentDto {
  @ApiProperty({ example: "GPT-5.4 Mini" })
  @IsString()
  name: string;

  @ApiProperty({
    example: "openai",
    enum: ["openai", "anthropic", "google", "groq", "xai", "moonshot", "openrouter"],
  })
  @IsString()
  @IsIn(["openai", "anthropic", "google", "groq", "xai", "moonshot", "openrouter"])
  provider: string;

  @ApiProperty({ example: "gpt-5.4-mini" })
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
