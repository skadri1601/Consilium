import {
  IsArray,
  IsString,
  IsOptional,
  IsIn,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class EstimateDebateDto {
  @ApiProperty({
    description: "The debate topic or prompt",
    example: "Create a REST API for a todo app",
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  topic: string;

  @ApiProperty({
    description: "List of model IDs to use",
    example: ["gpt-5.4-mini", "claude-haiku-4-5-20251001"],
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
}

export class EstimateBreakdownDto {
  @ApiProperty({ example: "gpt-5.4-mini" })
  model: string;

  @ApiProperty({ example: "debater" })
  role: string;

  @ApiProperty({ example: 0.0012 })
  estimatedCost: number;
}

export class EstimateResponseDto {
  @ApiProperty({ example: 0.0048 })
  estimatedCost: number;

  @ApiProperty({ type: [EstimateBreakdownDto] })
  breakdown: EstimateBreakdownDto[];

  @ApiProperty({ example: 3 })
  rounds: number;

  @ApiProperty({ example: "council" })
  mode: string;
}
