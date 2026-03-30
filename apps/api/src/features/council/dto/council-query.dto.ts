import { IsString, IsArray, IsOptional, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CouncilQueryDto {
  @ApiProperty({ example: "Explain quantum computing in simple terms" })
  @IsString()
  query: string;

  @ApiProperty({
    example: ["gpt-4o-mini", "claude-3-5-haiku", "gemini-2.0-flash"],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  agents: string[];

  @ApiProperty({
    required: false,
    enum: ["blind", "visible"],
    default: "visible",
  })
  @IsOptional()
  @IsIn(["blind", "visible"])
  mode?: string;
}
