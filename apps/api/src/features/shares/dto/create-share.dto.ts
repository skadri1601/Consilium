import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateShareDto {
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  public?: boolean;

  @ApiProperty({
    required: false,
    description: "Lifetime of the share in hours",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresIn?: number;

  @ApiProperty({
    required: true,
    description: "Serialized session JSON from the CLI",
  })
  @IsObject()
  @IsNotEmpty()
  payload: Record<string, unknown>;
}
