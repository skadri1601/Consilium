import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service";

const mockSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

const envConfigService = {
  get: <T>(key: string): T | undefined => process.env[key] as T | undefined,
};

describe("EmailService", () => {
  let service: EmailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ id: "test-email-id" });
  });

  describe("when RESEND_API_KEY is set", () => {
    beforeEach(async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      delete process.env.RESEND_FROM_ADDRESS;
      delete process.env.APP_URL;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: envConfigService },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    afterEach(() => {
      delete process.env.RESEND_API_KEY;
    });

    it("sends welcome email with correct to, subject, and from", async () => {
      const result = await service.sendWelcomeEmail("user@example.com", "Ada");

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("user@example.com");
      expect(call.subject).toBe("Welcome to Consilium — glad you're here");
      expect(call.from).toContain("saad@myconsilium.xyz");
    });

    it("defaults from address to saad@myconsilium.xyz when RESEND_FROM_ADDRESS is not set", async () => {
      await service.sendWelcomeEmail("user@example.com", "Ada");

      const call = mockSend.mock.calls[0][0];
      expect(call.from).toContain("saad@myconsilium.xyz");
    });

    it("respects RESEND_FROM_ADDRESS override", async () => {
      process.env.RESEND_FROM_ADDRESS = "other@example.com";

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: envConfigService },
        ],
      }).compile();
      const overriddenService = module.get<EmailService>(EmailService);

      await overriddenService.sendWelcomeEmail("user@example.com", "Ada");

      const call = mockSend.mock.calls[0][0];
      expect(call.from).toBe("other@example.com");

      delete process.env.RESEND_FROM_ADDRESS;
    });

    it("includes the user's first name in the email body", async () => {
      await service.sendWelcomeEmail("user@example.com", "Ada");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Hi Ada");
    });

    it("falls back to 'there' when firstName is empty", async () => {
      await service.sendWelcomeEmail("user@example.com", "");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Hi there");
    });

    it("includes warm copy in the email body", async () => {
      await service.sendWelcomeEmail("user@example.com", "Ada");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("giving Consilium a chance");
    });

    it("links to myconsilium.xyz by default", async () => {
      await service.sendWelcomeEmail("user@example.com", "Ada");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("myconsilium.xyz");
    });

    it("returns success: false and does not throw when Resend errors", async () => {
      mockSend.mockRejectedValueOnce(new Error("Resend API error"));

      const result = await service.sendWelcomeEmail("user@example.com", "Ada");

      expect(result.success).toBe(false);
    });
  });

  describe("when RESEND_API_KEY is not set", () => {
    beforeEach(async () => {
      delete process.env.RESEND_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: envConfigService },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it("returns success: false without calling Resend", async () => {
      const result = await service.sendWelcomeEmail("user@example.com", "Ada");

      expect(result.success).toBe(false);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
