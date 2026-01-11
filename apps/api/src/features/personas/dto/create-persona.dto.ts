import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePersonaDto {
  @ApiProperty({ example: "Security Expert" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Focuses on security and best practices", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: "You are a security expert..." })
  @IsString()
  systemPrompt: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

