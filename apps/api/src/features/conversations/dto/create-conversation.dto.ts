import { IsString, IsOptional, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateConversationDto {
  @ApiProperty({ required: false, example: "My first conversation" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    required: false,
    enum: ["blind", "visible"],
    default: "visible",
  })
  @IsOptional()
  @IsIn(["blind", "visible"])
  mode?: string;
}
