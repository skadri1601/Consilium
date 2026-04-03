import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";

const mockClerk = {
  verifyToken: jest.fn(),
  users: {
    getUser: jest.fn(),
  },
  sessions: {
    revokeSession: jest.fn(),
    getSessionList: jest.fn(),
  },
};

jest.mock("@clerk/clerk-sdk-node", () => ({
  createClerkClient: jest.fn(() => mockClerk),
}));

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe("verifyToken", () => {
    it("should return session data for valid token", async () => {
      const mockSession = {
        sub: "user-123",
        sid: "session-456",
        exp: Date.now() / 1000 + 3600,
      };

      mockClerk.verifyToken.mockResolvedValue(mockSession);

      const result = await service.verifyToken("valid-token");

      expect(result).toEqual(mockSession);
    });

    it("should return null for invalid token", async () => {
      mockClerk.verifyToken.mockRejectedValue(new Error("Invalid token"));

      const result = await service.verifyToken("invalid-token");

      expect(result).toBeNull();
    });

    it("should return null for expired token", async () => {
      mockClerk.verifyToken.mockRejectedValue(new Error("Token expired"));

      const result = await service.verifyToken("expired-token");

      expect(result).toBeNull();
    });
  });

  describe("getUser", () => {
    it("should return user data for valid userId", async () => {
      const mockUser = {
        id: "user-123",
        emailAddresses: [{ emailAddress: "test@example.com" }],
        firstName: "John",
        lastName: "Doe",
      };

      mockClerk.users.getUser.mockResolvedValue(mockUser);

      const result = await service.getUser("user-123");

      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      mockClerk.users.getUser.mockRejectedValue(new Error("User not found"));

      const result = await service.getUser("nonexistent-user");

      expect(result).toBeNull();
    });
  });

  describe("revokeSession", () => {
    it("should revoke session successfully", async () => {
      mockClerk.sessions.revokeSession.mockResolvedValue({});

      const result = await service.revokeSession("session-123");

      expect(result).toBe(true);
      expect(mockClerk.sessions.revokeSession).toHaveBeenCalledWith(
        "session-123",
      );
    });

    it("should return false when revocation fails", async () => {
      mockClerk.sessions.revokeSession.mockRejectedValue(
        new Error("Revocation failed"),
      );

      const result = await service.revokeSession("session-123");

      expect(result).toBe(false);
    });
  });

  describe("revokeAllUserSessions", () => {
    it("should revoke all active sessions for user", async () => {
      const mockSessions = {
        data: [
          { id: "session-1", status: "active" },
          { id: "session-2", status: "active" },
          { id: "session-3", status: "ended" },
        ],
      };

      mockClerk.sessions.getSessionList.mockResolvedValue(mockSessions);
      mockClerk.sessions.revokeSession.mockResolvedValue({});

      const result = await service.revokeAllUserSessions("user-123");

      expect(result).toBe(true);
      expect(mockClerk.sessions.getSessionList).toHaveBeenCalledWith({
        userId: "user-123",
      });
      expect(mockClerk.sessions.revokeSession).toHaveBeenCalledTimes(2);
      expect(mockClerk.sessions.revokeSession).toHaveBeenCalledWith(
        "session-1",
      );
      expect(mockClerk.sessions.revokeSession).toHaveBeenCalledWith(
        "session-2",
      );
    });

    it("should return false when getting sessions fails", async () => {
      mockClerk.sessions.getSessionList.mockRejectedValue(
        new Error("Failed to get sessions"),
      );

      const result = await service.revokeAllUserSessions("user-123");

      expect(result).toBe(false);
    });
  });

  describe("getUserSessions", () => {
    it("should return only active sessions", async () => {
      const mockSessions = {
        data: [
          { id: "session-1", status: "active" },
          { id: "session-2", status: "ended" },
          { id: "session-3", status: "active" },
        ],
      };

      mockClerk.sessions.getSessionList.mockResolvedValue(mockSessions);

      const result = await service.getUserSessions("user-123");

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: "session-1", status: "active" },
        { id: "session-3", status: "active" },
      ]);
    });

    it("should return empty array when error occurs", async () => {
      mockClerk.sessions.getSessionList.mockRejectedValue(new Error("Error"));

      const result = await service.getUserSessions("user-123");

      expect(result).toEqual([]);
    });
  });
});
