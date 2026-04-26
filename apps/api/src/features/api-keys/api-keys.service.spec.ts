import { Test, TestingModule } from "@nestjs/testing";
import { ApiKeysService } from "./api-keys.service";
import { PrismaService } from "../../shared/database/prisma.service";
import { EncryptionService } from "../../shared/services/encryption.service";
import { UpdateApiKeysDto } from "./dto/update-api-keys.dto";
import { TestApiKeyDto, ApiKeyProvider } from "./dto/test-api-key.dto";

jest.mock("@clerk/clerk-sdk-node", () => ({
  createClerkClient: jest.fn(() => ({
    users: {
      getUser: jest.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: "test@example.com" }],
      }),
    },
  })),
}));

describe("ApiKeysService", () => {
  let service: ApiKeysService;
  let prismaService: PrismaService;
  let encryptionService: EncryptionService;

  const mockUser = {
    id: "user-1",
    clerkId: "clerk-123",
    email: "test@example.com",
    openaiKey: "encrypted-openai-key",
    anthropicKey: "encrypted-anthropic-key",
    googleKey: null,
    groqKey: null,
    xaiKey: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((key) => `encrypted-${key}`),
            decrypt: jest.fn((encrypted) =>
              encrypted.replace("encrypted-", ""),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    prismaService = module.get<PrismaService>(PrismaService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  describe("getApiKeys", () => {
    it("should return masked API keys", async () => {
      jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(mockUser as any);

      const result = await service.getApiKeys("clerk-123");

      expect(result.openaiKey).toContain("****");
      expect(result.anthropicKey).toContain("****");
      expect(result.googleKey).toBeNull();
      expect(result.groqKey).toBeNull();
      expect(result.xaiKey).toBeNull();
    });

    it("should return empty keys if user not found", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);

      const result = await service.getApiKeys("invalid");

      expect(result.openaiKey).toBeNull();
      expect(result.anthropicKey).toBeNull();
      expect(result.googleKey).toBeNull();
      expect(result.groqKey).toBeNull();
      expect(result.xaiKey).toBeNull();
    });
  });

  describe("updateApiKeys", () => {
    it("should update API keys", async () => {
      jest
        .spyOn(prismaService.user, "upsert")
        .mockResolvedValue(mockUser as any);
      jest.spyOn(service, "getApiKeys").mockResolvedValue({
        openaiKey: "****-new",
        anthropicKey: null,
        googleKey: null,
        groqKey: null,
        xaiKey: null,
        moonshotKey: null,
        openrouterKey: null,
      });

      const dto: UpdateApiKeysDto = {
        openaiKey: "sk-new-key",
      };

      const result = await service.updateApiKeys("clerk-123", dto);

      expect(encryptionService.encrypt).toHaveBeenCalledWith("sk-new-key");
      expect(prismaService.user.upsert).toHaveBeenCalled();
      expect(result.message).toBe("API keys updated successfully");
    });

    it("should handle null values to delete keys", async () => {
      jest
        .spyOn(prismaService.user, "upsert")
        .mockResolvedValue(mockUser as any);
      jest.spyOn(service, "getApiKeys").mockResolvedValue({
        openaiKey: null,
        anthropicKey: null,
        googleKey: null,
        groqKey: null,
        xaiKey: null,
        moonshotKey: null,
        openrouterKey: null,
      });

      const dto: UpdateApiKeysDto = {
        openaiKey: "",
      };

      await service.updateApiKeys("clerk-123", dto);

      expect(prismaService.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clerkId: "clerk-123" },
          update: { openaiKey: null },
        }),
      );
    });
  });

  describe("getUserApiKeys", () => {
    it("should decrypt and return user API keys", async () => {
      jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(mockUser as any);

      const result = await service.getUserApiKeys("clerk-123");

      expect(encryptionService.decrypt).toHaveBeenCalled();
      expect(result).toHaveProperty("openaiKey");
      expect(result).toHaveProperty("anthropicKey");
    });

    it("should fallback to environment variables if user keys not available", async () => {
      const userWithoutKeys = {
        ...mockUser,
        openaiKey: null,
        anthropicKey: null,
        googleKey: null,
        groqKey: null,
        xaiKey: null,
      };
      jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(userWithoutKeys as any);
      process.env.OPENAI_API_KEY = "env-openai-key";
      process.env.ANTHROPIC_API_KEY = "env-anthropic-key";
      process.env.GROQ_API_KEY = "env-groq-key";

      const result = await service.getUserApiKeys("clerk-123");

      expect(result.openaiKey).toBe("env-openai-key");
      expect(result.anthropicKey).toBe("env-anthropic-key");
      expect(result.groqKey).toBe("env-groq-key");
    });
  });

  describe("testApiKey", () => {
    it("should test OpenAI key", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const dto: TestApiKeyDto = {
        provider: ApiKeyProvider.OPENAI,
        key: "sk-test-key",
      };

      const result = await service.testApiKey(dto);

      expect(result.valid).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/models",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer sk-test-key",
          }),
        }),
      );
    });

    it("should test Anthropic key", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const dto: TestApiKeyDto = {
        provider: ApiKeyProvider.ANTHROPIC,
        key: "sk-ant-test-key",
      };

      const result = await service.testApiKey(dto);

      expect(result.valid).toBe(true);
    });

    it("should test Google key", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const dto: TestApiKeyDto = {
        provider: ApiKeyProvider.GOOGLE,
        key: "AIza-test-key",
      };

      const result = await service.testApiKey(dto);

      expect(result.valid).toBe(true);
    });

    it("should test Groq key", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const dto: TestApiKeyDto = {
        provider: ApiKeyProvider.GROQ,
        key: "gsk-test-key",
      };

      const result = await service.testApiKey(dto);

      expect(result.valid).toBe(true);
    });

    it("should return invalid for failed API calls", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      });

      const dto: TestApiKeyDto = {
        provider: ApiKeyProvider.OPENAI,
        key: "invalid-key",
      };

      const result = await service.testApiKey(dto);

      expect(result.valid).toBe(false);
    });
  });
});
