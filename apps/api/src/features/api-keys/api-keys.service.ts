import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { EncryptionService } from "../../shared/services/encryption.service";
import { UpdateApiKeysDto } from "./dto/update-api-keys.dto";
import { TestApiKeyDto, ApiKeyProvider } from "./dto/test-api-key.dto";
import { createClerkClient } from "@clerk/backend";

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async getApiKeys(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        this.logger.warn(`User not found in database for clerkId: ${userId}`);
        return {
          openaiKey: null,
          anthropicKey: null,
          googleKey: null,
          groqKey: null,
          xaiKey: null,
          moonshotKey: null,
          openrouterKey: null,
        };
      }

      const userWithKeys = user as typeof user & {
        openaiKey?: string | null;
        anthropicKey?: string | null;
        googleKey?: string | null;
        groqKey?: string | null;
        xaiKey?: string | null;
        moonshotKey?: string | null;
        openrouterKey?: string | null;
      };

      return {
        openaiKey: userWithKeys.openaiKey
          ? this.maskKey(userWithKeys.openaiKey)
          : null,
        anthropicKey: userWithKeys.anthropicKey
          ? this.maskKey(userWithKeys.anthropicKey)
          : null,
        googleKey: userWithKeys.googleKey
          ? this.maskKey(userWithKeys.googleKey)
          : null,
        groqKey: userWithKeys.groqKey
          ? this.maskKey(userWithKeys.groqKey)
          : null,
        xaiKey: userWithKeys.xaiKey ? this.maskKey(userWithKeys.xaiKey) : null,
        moonshotKey: userWithKeys.moonshotKey
          ? this.maskKey(userWithKeys.moonshotKey)
          : null,
        openrouterKey: userWithKeys.openrouterKey
          ? this.maskKey(userWithKeys.openrouterKey)
          : null,
      };
    } catch (error) {
      this.logger.error("Error fetching API keys:", error);
      throw new BadRequestException("Failed to fetch API keys");
    }
  }

  async updateApiKeys(userId: string, dto: UpdateApiKeysDto) {
    const updateData: any = {};

    if (dto.openaiKey !== undefined) {
      updateData.openaiKey = dto.openaiKey
        ? this.encryption.encrypt(dto.openaiKey)
        : null;
    }

    if (dto.anthropicKey !== undefined) {
      updateData.anthropicKey = dto.anthropicKey
        ? this.encryption.encrypt(dto.anthropicKey)
        : null;
    }

    if (dto.googleKey !== undefined) {
      updateData.googleKey = dto.googleKey
        ? this.encryption.encrypt(dto.googleKey)
        : null;
    }

    if (dto.groqKey !== undefined) {
      updateData.groqKey = dto.groqKey
        ? this.encryption.encrypt(dto.groqKey)
        : null;
    }

    if (dto.xaiKey !== undefined) {
      updateData.xaiKey = dto.xaiKey
        ? this.encryption.encrypt(dto.xaiKey)
        : null;
    }

    if (dto.moonshotKey !== undefined) {
      updateData.moonshotKey = dto.moonshotKey
        ? this.encryption.encrypt(dto.moonshotKey)
        : null;
    }

    if (dto.openrouterKey !== undefined) {
      updateData.openrouterKey = dto.openrouterKey
        ? this.encryption.encrypt(dto.openrouterKey)
        : null;
    }

    let email = `${userId}@clerk.user`;
    try {
      const clerkUser = await this.clerk.users.getUser(userId);
      if (clerkUser.emailAddresses.length > 0) {
        email = clerkUser.emailAddresses[0].emailAddress;
      }
    } catch (error) {
      this.logger.warn("Failed to fetch user details from Clerk:", error);
    }

    await this.prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        email: email,
        tenantId: userId,
        ...updateData,
      },
      update: updateData,
    });

    return {
      message: "API keys updated successfully",
      keys: await this.getApiKeys(userId),
    };
  }

  async testApiKey(
    dto: TestApiKeyDto,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      switch (dto.provider) {
        case ApiKeyProvider.OPENAI:
          return await this.probe(
            "OpenAI",
            "https://api.openai.com/v1/models",
            { headers: { Authorization: `Bearer ${dto.key}` } },
          );
        case ApiKeyProvider.ANTHROPIC:
          return await this.probe(
            "Anthropic",
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                "x-api-key": dto.key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
              },
              body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 10,
                messages: [{ role: "user", content: "test" }],
              }),
            },
          );
        case ApiKeyProvider.GOOGLE:
          return await this.probe(
            "Google AI",
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${dto.key}`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: "test" }] }],
              }),
            },
          );
        case ApiKeyProvider.GROQ:
          return await this.probe(
            "Groq",
            "https://api.groq.com/openai/v1/models",
            { headers: { Authorization: `Bearer ${dto.key}` } },
          );
        case ApiKeyProvider.XAI:
          return await this.probe("XAI (Grok)", "https://api.x.ai/v1/models", {
            headers: { Authorization: `Bearer ${dto.key}` },
          });
        case ApiKeyProvider.MOONSHOT:
          return await this.probe(
            "Moonshot",
            "https://api.moonshot.cn/v1/models",
            { headers: { Authorization: `Bearer ${dto.key}` } },
          );
        case ApiKeyProvider.OPENROUTER:
          return await this.probe(
            "OpenRouter",
            "https://openrouter.ai/api/v1/auth/key",
            { headers: { Authorization: `Bearer ${dto.key}` } },
          );
        default:
          throw new BadRequestException("Invalid provider");
      }
    } catch (error) {
      return {
        valid: false,
        message:
          error instanceof Error ? error.message : "Failed to validate API key",
      };
    }
  }

  private async probe(
    label: string,
    url: string,
    init: RequestInit,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        return {
          valid: false,
          message: `Invalid ${label} API key: ${errorMessage}`,
        };
      }
      return { valid: true, message: `${label} API key is valid` };
    } catch (error) {
      return {
        valid: false,
        message: `Failed to validate: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getUserApiKeys(userId: string): Promise<{
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
    xaiKey?: string;
    moonshotKey?: string;
    openrouterKey?: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return {
        openaiKey: process.env.OPENAI_API_KEY,
        anthropicKey: process.env.ANTHROPIC_API_KEY,
        googleKey: process.env.GOOGLE_API_KEY,
        groqKey: process.env.GROQ_API_KEY,
        xaiKey: process.env.XAI_API_KEY,
        moonshotKey: process.env.MOONSHOT_API_KEY,
        openrouterKey: process.env.OPENROUTER_API_KEY,
      };
    }

    const userWithKeys = user as typeof user & {
      openaiKey?: string | null;
      anthropicKey?: string | null;
      googleKey?: string | null;
      groqKey?: string | null;
      xaiKey?: string | null;
      moonshotKey?: string | null;
      openrouterKey?: string | null;
    };

    const keys: Record<string, string | undefined> = {};

    const keyMap = {
      openaiKey: userWithKeys.openaiKey,
      anthropicKey: userWithKeys.anthropicKey,
      googleKey: userWithKeys.googleKey,
      groqKey: userWithKeys.groqKey,
      xaiKey: userWithKeys.xaiKey,
      moonshotKey: userWithKeys.moonshotKey,
      openrouterKey: userWithKeys.openrouterKey,
    };

    for (const [keyName, encryptedValue] of Object.entries(keyMap)) {
      if (encryptedValue) {
        try {
          keys[keyName] = this.encryption.decrypt(encryptedValue);
        } catch (error) {
          this.logger.error(`Failed to decrypt ${keyName}:`, error);
        }
      }
    }

    const envFallbacks: Array<[keyof typeof keys, string | undefined]> = [
      ["openaiKey", process.env.OPENAI_API_KEY],
      ["anthropicKey", process.env.ANTHROPIC_API_KEY],
      ["googleKey", process.env.GOOGLE_API_KEY],
      ["groqKey", process.env.GROQ_API_KEY],
      ["xaiKey", process.env.XAI_API_KEY],
      ["moonshotKey", process.env.MOONSHOT_API_KEY],
      ["openrouterKey", process.env.OPENROUTER_API_KEY],
    ];
    for (const [name, envVal] of envFallbacks) {
      if (!keys[name] && envVal) {
        keys[name] = envVal;
      }
    }

    return keys;
  }

  private maskKey(key: string | null | undefined): string {
    if (!key || typeof key !== "string" || key.length <= 4) {
      return "****";
    }
    return `****${key.slice(-4)}`;
  }
}
