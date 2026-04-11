import {
  IsArray,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDeliberationDto {
  @ApiProperty({
    description: "The topic or question to deliberate on",
    example: "Should we migrate from REST to GraphQL?",
    minLength: 3,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  topic: string;

  @ApiPropertyOptional({
    description: "Deliberation mode",
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

  @ApiProperty({
    description: "List of model IDs to use in deliberation",
    example: ["gpt-4o-mini", "claude-3-5-haiku-latest", "gemini-2.0-flash"],
    type: [String],
    minItems: 2,
    maxItems: 8,
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  models: string[];

  @ApiPropertyOptional({
    description: "Maximum number of deliberation rounds",
    example: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxRounds?: number;

  @ApiPropertyOptional({
    description: "API keys for model providers",
  })
  @IsOptional()
  apiKeys?: {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
    xaiKey?: string;
  };

  @ApiPropertyOptional({
    description:
      "Optional JSON from blind-eval responses file; stored on the session for auditing (workers may ignore until wired).",
  })
  @IsOptional()
  @IsObject()
  responses?: Record<string, unknown>;
}
