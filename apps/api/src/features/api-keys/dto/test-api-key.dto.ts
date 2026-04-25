import { IsEnum, IsString } from "class-validator";

export enum ApiKeyProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  GROQ = "groq",
  XAI = "xai",
  MOONSHOT = "moonshot",
  OPENROUTER = "openrouter",
}

export class TestApiKeyDto {
  @IsEnum(ApiKeyProvider)
  provider: ApiKeyProvider;

  @IsString()
  key: string;
}
