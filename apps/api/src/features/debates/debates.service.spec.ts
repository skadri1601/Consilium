import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { DebatesService } from "./debates.service";
import { PrismaService } from "../../shared/database/prisma.service";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { AiWorkersClient } from "./ai-workers.client";
import { PersonasService } from "../personas/personas.service";

describe("DebatesService", () => {
  let service: DebatesService;
  let _prismaService: jest.Mocked<PrismaService>;
  let _apiKeysService: jest.Mocked<ApiKeysService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    debateSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    debateRound: {
      create: jest.fn(),
    },
    debateMessage: {
      create: jest.fn(),
    },
    conversationV2: {
      create: jest.fn().mockResolvedValue({ id: "conv-123" }),
    },
  };

  const mockApiKeysService = {
    getUserApiKeys: jest.fn(),
  };

  const mockAiWorkersClient = {
    startDebate: jest.fn(),
    getStreamUrl: jest.fn(),
    healthCheck: jest.fn(),
  };

  const mockRedis = {
    publish: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ApiKeysService, useValue: mockApiKeysService },
        { provide: AiWorkersClient, useValue: mockAiWorkersClient },
        { provide: PersonasService, useValue: { findOne: jest.fn() } },
        {
          provide: "default_IORedisModuleConnectionToken",
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<DebatesService>(DebatesService);
    _prismaService = module.get(PrismaService);
    _apiKeysService = module.get(ApiKeysService);

    jest.clearAllMocks();
  });

  describe("createDebate", () => {
    const userId = "user-123";
    const createDto = {
      topic: "Build a REST API with authentication",
      models: ["gpt-4o-mini", "claude-3-5-haiku-latest"],
    };

    it("should create a debate session when user has API keys", async () => {
      const mockUser = {
        id: "internal-id",
        clerkId: userId,
        email: "test@test.com",
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      mockApiKeysService.getUserApiKeys.mockResolvedValue({
        openaiKey: "sk-test-key",
        anthropicKey: "sk-ant-test-key",
      });

      const expectedDebate = {
        id: "debate-123",
        userId: mockUser.id,
        topic: createDto.topic,
        status: "pending",
        modelsUsed: createDto.models,
        totalCost: 0,
      };

      mockPrismaService.debateSession.create.mockResolvedValue(expectedDebate);
      mockAiWorkersClient.startDebate.mockResolvedValue({
        debateId: "debate-123",
        status: "processing",
      });
      mockPrismaService.debateSession.update.mockResolvedValue({
        ...expectedDebate,
        status: "processing",
      });

      const result = await service.createDebate(userId, createDto);

      expect(result).toEqual(expectedDebate);
      expect(mockApiKeysService.getUserApiKeys).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.debateSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            topic: createDto.topic,
            status: "pending",
            modelsUsed: createDto.models,
          }),
        }),
      );
    });

    it("should throw NotFoundException when user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createDebate(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAll", () => {
    const clerkId = "user-123";

    it("should return paginated debate sessions", async () => {
      const mockUser = { id: "internal-id", clerkId };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const mockDebates = [
        {
          id: "debate-1",
          userId: mockUser.id,
          topic: "Topic 1",
          status: "completed",
          rounds: [],
        },
        {
          id: "debate-2",
          userId: mockUser.id,
          topic: "Topic 2",
          status: "pending",
          rounds: [],
        },
      ];

      mockPrismaService.debateSession.findMany.mockResolvedValue(mockDebates);

      const result = await service.findAll(clerkId, 20, 0);

      expect(result).toEqual(mockDebates);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId },
      });
      expect(mockPrismaService.debateSession.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        skip: 0,
        include: {
          rounds: {
            include: {
              messages: true,
            },
          },
        },
      });
    });

    it("should return empty array when user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findAll(clerkId);

      expect(result).toEqual([]);
    });

    it("should use default pagination values", async () => {
      const mockUser = { id: "internal-id", clerkId };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.debateSession.findMany.mockResolvedValue([]);

      await service.findAll(clerkId);

      expect(mockPrismaService.debateSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        }),
      );
    });
  });

  describe("findOne", () => {
    const clerkId = "user-123";
    const debateId = "debate-123";

    it("should return debate session with rounds and messages", async () => {
      const mockUser = { id: "internal-id", clerkId };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const mockDebate = {
        id: debateId,
        userId: mockUser.id,
        topic: "Test topic",
        status: "completed",
        goldenPrompt: "Generated prompt",
        rounds: [
          {
            id: "round-1",
            roundNumber: 1,
            messages: [{ id: "msg-1", content: "Response" }],
          },
        ],
      };

      mockPrismaService.debateSession.findFirst.mockResolvedValue(mockDebate);

      const result = await service.findOne(debateId, clerkId);

      expect(result).toEqual(mockDebate);
      expect(mockPrismaService.debateSession.findFirst).toHaveBeenCalledWith({
        where: { id: debateId, userId: mockUser.id },
        include: {
          rounds: {
            include: {
              messages: {
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { roundNumber: "asc" },
          },
        },
      });
    });

    it("should throw NotFoundException when user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(debateId, clerkId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when debate not found", async () => {
      const mockUser = { id: "internal-id", clerkId };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.debateSession.findFirst.mockResolvedValue(null);

      await expect(service.findOne(debateId, clerkId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateStatus", () => {
    it("should update debate status", async () => {
      const debateId = "debate-123";
      const updatedDebate = {
        id: debateId,
        status: "completed",
        goldenPrompt: "Final prompt",
      };

      mockPrismaService.debateSession.update.mockResolvedValue(updatedDebate);

      const result = await service.updateStatus(
        debateId,
        "completed",
        "Final prompt",
      );

      expect(result).toEqual(updatedDebate);
      expect(mockPrismaService.debateSession.update).toHaveBeenCalledWith({
        where: { id: debateId },
        data: {
          status: "completed",
          goldenPrompt: "Final prompt",
        },
      });
    });

    it("should update status without goldenPrompt", async () => {
      const debateId = "debate-123";

      await service.updateStatus(debateId, "processing");

      expect(mockPrismaService.debateSession.update).toHaveBeenCalledWith({
        where: { id: debateId },
        data: {
          status: "processing",
        },
      });
    });
  });

  describe("addRound", () => {
    it("should create a new round", async () => {
      const sessionId = "session-123";
      const roundNumber = 1;
      const expectedRound = {
        id: "round-123",
        sessionId,
        roundNumber,
        status: "pending",
      };

      mockPrismaService.debateRound.create.mockResolvedValue(expectedRound);

      const result = await service.addRound(sessionId, roundNumber);

      expect(result).toEqual(expectedRound);
      expect(mockPrismaService.debateRound.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          roundNumber,
          status: "pending",
        },
      });
    });
  });

  describe("addMessage", () => {
    it("should create a debate message", async () => {
      const messageData = {
        roundId: "round-123",
        agentId: "agent-1",
        modelUsed: "gpt-4o-mini",
        content: "Agent response",
        promptTokens: 100,
        completionTokens: 200,
        cost: 0.001,
        latencyMs: 1500,
      };

      const expectedMessage = { id: "msg-123", ...messageData };
      mockPrismaService.debateMessage.create.mockResolvedValue(expectedMessage);

      const result = await service.addMessage(
        messageData.roundId,
        messageData.agentId,
        messageData.modelUsed,
        messageData.content,
        messageData.promptTokens,
        messageData.completionTokens,
        messageData.cost,
        messageData.latencyMs,
      );

      expect(result).toEqual(expectedMessage);
      expect(mockPrismaService.debateMessage.create).toHaveBeenCalledWith({
        data: messageData,
      });
    });
  });

  describe("updateTotalCost", () => {
    it("should increment total cost", async () => {
      const sessionId = "session-123";
      const cost = 0.05;

      await service.updateTotalCost(sessionId, cost);

      expect(mockPrismaService.debateSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: { totalCost: { increment: cost } },
      });
    });
  });
});
