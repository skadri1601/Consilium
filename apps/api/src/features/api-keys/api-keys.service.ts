import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { EncryptionService } from "../../shared/services/encryption.service";
import { UpdateApiKeysDto } from "./dto/update-api-keys.dto";
import { TestApiKeyDto, ApiKeyProvider } from "./dto/test-api-key.dto";
import { createClerkClient } from "@clerk/clerk-sdk-node";

@Injectable()
export class ApiKeysService {
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
        // Return empty keys instead of throwing error - user might not be in DB yet
        console.warn(`User not found in database for clerkId: ${userId}`);
        return {
          openaiKey: null,
          anthropicKey: null,
          googleKey: null,
          groqKey: null,
        };
      }

      // Type assertion for API key fields that may not be in schema
      const userWithKeys = user as typeof user & {
        openaiKey?: string | null;
        anthropicKey?: string | null;
        googleKey?: string | null;
        groqKey?: string | null;
      };

      // Return masked keys (last 4 characters)
      return {
        openaiKey: userWithKeys.openaiKey ? this.maskKey(userWithKeys.openaiKey) : null,
        anthropicKey: userWithKeys.anthropicKey ? this.maskKey(userWithKeys.anthropicKey) : null,
        googleKey: userWithKeys.googleKey ? this.maskKey(userWithKeys.googleKey) : null,
        groqKey: userWithKeys.groqKey ? this.maskKey(userWithKeys.groqKey) : null,
      };
    } catch (error) {
      console.error("Error fetching API keys:", error);
      throw new BadRequestException(
        `Failed to fetch API keys: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async updateApiKeys(userId: string, dto: UpdateApiKeysDto) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    const updateData: any = {};

    if (dto.openaiKey !== undefined) {
      updateData.openaiKey = dto.openaiKey ? this.encryption.encrypt(dto.openaiKey) : null;
    }

    if (dto.anthropicKey !== undefined) {
      updateData.anthropicKey = dto.anthropicKey ? this.encryption.encrypt(dto.anthropicKey) : null;
    }

    if (dto.googleKey !== undefined) {
      updateData.googleKey = dto.googleKey ? this.encryption.encrypt(dto.googleKey) : null;
    }

    if (dto.groqKey !== undefined) {
      updateData.groqKey = dto.groqKey ? this.encryption.encrypt(dto.groqKey) : null;
    }

    await this.prisma.user.update({
      where: { clerkId: userId },
      data: updateData,
    });

    return {
      message: "API keys updated successfully",
      keys: await this.getApiKeys(userId),
    };
  }

  async testApiKey(dto: TestApiKeyDto): Promise<{ valid: boolean; message: string }> {
    try {
      switch (dto.provider) {
        case ApiKeyProvider.OPENAI:
          return await this.testOpenAIKey(dto.key);
        case ApiKeyProvider.ANTHROPIC:
          return await this.testAnthropicKey(dto.key);
        case ApiKeyProvider.GOOGLE:
          return await this.testGoogleKey(dto.key);
        case ApiKeyProvider.GROQ:
          return await this.testGroqKey(dto.key);
        default:
          throw new BadRequestException("Invalid provider");
      }
    } catch (error) {
      return {
        valid: false,
        message: error.message || "Failed to validate API key",
      };
    }
  }

  private async testOpenAIKey(key: string): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (!response.ok) {
        return { valid: false, message: "Invalid OpenAI API key" };
      }

      return { valid: true, message: "OpenAI API key is valid" };
    } catch (error) {
      return { valid: false, message: `Failed to validate: ${error.message}` };
    }
  }

  private async testAnthropicKey(key: string): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 10,
          messages: [{ role: "user", content: "test" }],
        }),
      });

      if (!response.ok) {
        return { valid: false, message: "Invalid Anthropic API key" };
      }

      return { valid: true, message: "Anthropic API key is valid" };
    } catch (error) {
      return { valid: false, message: `Failed to validate: ${error.message}` };
    }
  }

  private async testGoogleKey(key: string): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "test" }] }],
          }),
        },
      );

      if (!response.ok) {
        return { valid: false, message: "Invalid Google AI API key" };
      }

      return { valid: true, message: "Google AI API key is valid" };
    } catch (error) {
      return { valid: false, message: `Failed to validate: ${error.message}` };
    }
  }

  private async testGroqKey(key: string): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (!response.ok) {
        return { valid: false, message: "Invalid Groq API key" };
      }

      return { valid: true, message: "Groq API key is valid" };
    } catch (error) {
      return { valid: false, message: `Failed to validate: ${error.message}` };
    }
  }

  async getUserApiKeys(userId: string): Promise<{
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
    groqKey?: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return {};
    }

    // Type assertion for API key fields that may not be in schema
    const userWithKeys = user as typeof user & {
      openaiKey?: string | null;
      anthropicKey?: string | null;
      googleKey?: string | null;
      groqKey?: string | null;
    };

    const keys: any = {};

    // Decrypt keys if they exist
    if (userWithKeys.openaiKey) {
      try {
        keys.openaiKey = this.encryption.decrypt(userWithKeys.openaiKey);
      } catch (error) {
        // If decryption fails, key might be corrupted
        console.error("Failed to decrypt OpenAI key:", error);
      }
    }

    if (userWithKeys.anthropicKey) {
      try {
        keys.anthropicKey = this.encryption.decrypt(userWithKeys.anthropicKey);
      } catch (error) {
        console.error("Failed to decrypt Anthropic key:", error);
      }
    }

    if (userWithKeys.googleKey) {
      try {
        keys.googleKey = this.encryption.decrypt(userWithKeys.googleKey);
      } catch (error) {
        console.error("Failed to decrypt Google key:", error);
      }
    }

    if (userWithKeys.groqKey) {
      try {
        keys.groqKey = this.encryption.decrypt(userWithKeys.groqKey);
      } catch (error) {
        console.error("Failed to decrypt Groq key:", error);
      }
    }

    // Fallback to environment variables if user keys not available
    if (!keys.openaiKey && process.env.OPENAI_API_KEY) {
      keys.openaiKey = process.env.OPENAI_API_KEY;
    }

    if (!keys.anthropicKey && process.env.ANTHROPIC_API_KEY) {
      keys.anthropicKey = process.env.ANTHROPIC_API_KEY;
    }

    if (!keys.googleKey && process.env.GOOGLE_API_KEY) {
      keys.googleKey = process.env.GOOGLE_API_KEY;
    }

    if (!keys.groqKey && process.env.GROQ_API_KEY) {
      keys.groqKey = process.env.GROQ_API_KEY;
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

