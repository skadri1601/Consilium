import { IsString, IsArray, IsOptional, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CouncilQueryDto {
  @ApiProperty({ example: "Explain quantum computing in simple terms" })
  @IsString()
  query: string;

  @ApiProperty({
    example: ["gpt-5.4-mini", "claude-haiku-4-5-20251001", "gemini-3-flash-preview"],
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
