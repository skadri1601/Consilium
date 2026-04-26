import { Test, TestingModule } from "@nestjs/testing";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { CliTokenService } from "../auth/services/cli-token.service";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";
import { UpdateApiKeysDto } from "./dto/update-api-keys.dto";
import { TestApiKeyDto, ApiKeyProvider } from "./dto/test-api-key.dto";

const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe("ApiKeysController", () => {
  let controller: ApiKeysController;
  let service: ApiKeysService;

  const mockUser = {
    userId: "user-123",
    sessionId: "session-456",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: {
            getApiKeys: jest.fn(),
            updateApiKeys: jest.fn(),
            testApiKey: jest.fn(),
          },
        },
        {
          provide: CliTokenService,
          useValue: {
            generate: jest.fn(),
            validate: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RateLimitGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<ApiKeysController>(ApiKeysController);
    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getApiKeys", () => {
    it("should return API keys", async () => {
      const mockKeys = {
        openaiKey: "****-key",
        anthropicKey: null,
        googleKey: null,
        groqKey: null,
        xaiKey: null,
        moonshotKey: null,
        openrouterKey: null,
      };

      jest.spyOn(service, "getApiKeys").mockResolvedValue(mockKeys);

      const result = await controller.getApiKeys(mockUser);

      expect(result).toEqual(mockKeys);
      expect(service.getApiKeys).toHaveBeenCalledWith("user-123");
    });
  });

  describe("updateApiKeys", () => {
    it("should update API keys", async () => {
      const dto: UpdateApiKeysDto = {
        openaiKey: "sk-new-key",
      };

      const mockResponse = {
        message: "API keys updated successfully",
        keys: {
          openaiKey: "****-new",
          anthropicKey: null,
          googleKey: null,
          groqKey: null,
          xaiKey: null,
          moonshotKey: null,
          openrouterKey: null,
        },
      };

      jest.spyOn(service, "updateApiKeys").mockResolvedValue(mockResponse);

      const result = await controller.updateApiKeys(mockUser, dto);

      expect(result).toEqual(mockResponse);
      expect(service.updateApiKeys).toHaveBeenCalledWith("user-123", dto);
    });
  });

  describe("testApiKey", () => {
    it("should test API key", async () => {
      const dto: TestApiKeyDto = {
        provider: ApiKeyProvider.OPENAI,
        key: "sk-test-key",
      };

      const mockResult = {
        valid: true,
        message: "OpenAI API key is valid",
      };

      jest.spyOn(service, "testApiKey").mockResolvedValue(mockResult);

      const result = await controller.testApiKey(dto);

      expect(result).toEqual(mockResult);
      expect(service.testApiKey).toHaveBeenCalledWith(dto);
    });
  });
});
