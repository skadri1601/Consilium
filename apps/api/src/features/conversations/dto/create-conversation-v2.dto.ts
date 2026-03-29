import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateConversationV2Dto {
  @ApiProperty({
    description: "Conversation title",
    example: "API Design Discussion",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;
}

export class AddDebateToConversationDto {
  @ApiProperty({
    description: "ID of the debate to link",
    example: "clxxxxxxxxxxxxxxxxx",
  })
  @IsString()
  debateId: string;
}
