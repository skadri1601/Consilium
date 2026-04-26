import { IsOptional, IsString } from "class-validator";

export class UpdateApiKeysDto {
  @IsOptional()
  @IsString()
  openaiKey?: string;

  @IsOptional()
  @IsString()
  anthropicKey?: string;

  @IsOptional()
  @IsString()
  googleKey?: string;

  @IsOptional()
  @IsString()
  groqKey?: string;

  @IsOptional()
  @IsString()
  xaiKey?: string;

  @IsOptional()
  @IsString()
  moonshotKey?: string;

  @IsOptional()
  @IsString()
  openrouterKey?: string;
}
