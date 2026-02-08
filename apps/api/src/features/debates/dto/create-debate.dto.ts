import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDebateDto {
  @ApiProperty({
    description: "The debate topic or prompt to discuss",
    example: "Create a REST API for a todo app",
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: "List of model IDs to use in the debate",
    example: ["gpt-4o-mini", "claude-3-5-haiku-latest", "gemini-2.0-flash", "llama-3.1-8b-instant"],
    type: [String],
    minItems: 2,
    maxItems: 5,
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  models: string[];
}

