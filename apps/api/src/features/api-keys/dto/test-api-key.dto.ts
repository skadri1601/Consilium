import { IsEnum, IsString } from "class-validator";

export enum ApiKeyProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  GROQ = "groq",
}

export class TestApiKeyDto {
  @IsEnum(ApiKeyProvider)
  provider: ApiKeyProvider;

  @IsString()
  key: string;
}

