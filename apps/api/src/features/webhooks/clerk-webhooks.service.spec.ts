import { Test, TestingModule } from "@nestjs/testing";
import { ClerkWebhooksService } from "./clerk-webhooks.service";
import { PrismaService } from "../../shared/database/prisma.service";
import { AuditLoggerService } from "../../shared/services/audit-logger.service";
import { SessionService } from "../../shared/services/session.service";
import { EmailService } from "../../shared/services/email.service";

const mockUser = {
  id: "db-user-1",
  clerkId: "clerk-abc123",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  tenantId: "clerk-abc123",
};

describe("ClerkWebhooksService", () => {
  let service: ClerkWebhooksService;
  let prismaService: { user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let emailService: { sendWelcomeEmail: jest.Mock };
  let auditLogger: { log: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
    };

    emailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    auditLogger = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkWebhooksService,
        { provide: PrismaService, useValue: prismaService },
        { provide: EmailService, useValue: emailService },
        { provide: AuditLoggerService, useValue: auditLogger },
        { provide: SessionService, useValue: {} },
      ],
    }).compile();

    service = module.get<ClerkWebhooksService>(ClerkWebhooksService);
  });

  describe("createUser", () => {
    const payload = {
      clerkId: "clerk-abc123",
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
    };

    it("sends a welcome email when a new user is created", async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await service.createUser(payload);
      await new Promise((resolve) => setImmediate(resolve));

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        "ada@example.com",
        "Ada",
      );
    });

    it("does NOT send a welcome email when the user already exists", async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await service.createUser(payload);
      await new Promise((resolve) => setImmediate(resolve));

      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("still creates the user successfully even if the welcome email fails", async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      emailService.sendWelcomeEmail.mockRejectedValueOnce(
        new Error("Resend timeout"),
      );

      const result = await service.createUser(payload);
      await new Promise((resolve) => setImmediate(resolve));

      expect(result.success).toBe(true);
      expect(result.userId).toBe("db-user-1");
    });

    it("throws when email is missing from payload", async () => {
      await expect(
        service.createUser({ clerkId: "clerk-abc123" }),
      ).rejects.toThrow("Email is required for user creation");
    });
  });
});
