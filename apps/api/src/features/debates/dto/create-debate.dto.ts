import {
  IsArray,
  IsString,
  IsOptional,
  IsObject,
  IsIn,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDebateDto {
  @ApiProperty({
    description: "The debate topic or prompt to discuss",
    example: "Create a REST API for a todo app",
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  topic: string;

  @ApiProperty({
    description: "List of model IDs to use in the debate",
    example: [
      "gpt-5.4-mini",
      "claude-haiku-4-5-20251001",
      "gemini-3-flash-preview",
      "llama-3.1-8b-instant",
    ],
    type: [String],
    minItems: 2,
    maxItems: 5,
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  models: string[];

  @ApiPropertyOptional({
    description:
      "Optional persona ID to apply a custom system prompt to all agents",
    example: "clxxxxxxxxxxxxxxxxx",
  })
  @IsOptional()
  @IsString()
  personaId?: string;

  @ApiPropertyOptional({
    description: "Debate mode",
    example: "council",
    enum: [
      "quick",
      "council",
      "deep",
      "blind",
      "redteam",
      "jury",
      "market",
      "auto",
    ],
    default: "council",
  })
  @IsOptional()
  @IsIn([
    "quick",
    "council",
    "deep",
    "blind",
    "redteam",
    "jury",
    "market",
    "auto",
  ])
  mode?: string;

  @ApiPropertyOptional({
    description: "Source of the debate request",
    example: "web",
    enum: ["web", "cli"],
    default: "web",
  })
  @IsOptional()
  @IsIn(["web", "cli"])
  debateSource?: string;

  @ApiPropertyOptional({
    description: "Project context for CLI codebase context",
  })
  @IsOptional()
  @IsObject()
  projectContext?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Conversation ID to link this debate as a follow-up",
    example: "clxxxxxxxxxxxxxxxxx",
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
