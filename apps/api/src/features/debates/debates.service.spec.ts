import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DebatesService } from "./debates.service";
import { PrismaService } from "../../shared/database/prisma.service";
import { ApiKeysService } from "../api-keys/api-keys.service";

describe("DebatesService", () => {
  let service: DebatesService;
  let prismaService: jest.Mocked<PrismaService>;
  let apiKeysService: jest.Mocked<ApiKeysService>;

  const mockPrismaService = {
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
  };

  const mockApiKeysService = {
    getUserApiKeys: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ApiKeysService, useValue: mockApiKeysService },
      ],
    }).compile();

    service = module.get<DebatesService>(DebatesService);
    prismaService = module.get(PrismaService);
    apiKeysService = module.get(ApiKeysService);

    jest.clearAllMocks();
  });

  describe("createDebate", () => {
    const userId = "user-123";
    const createDto = {
      topic: "Build a REST API with authentication",
      models: ["gpt-4o-mini", "claude-3-5-haiku-latest"],
    };

    it("should create a debate session when user has API keys", async () => {
      mockApiKeysService.getUserApiKeys.mockResolvedValue({
        openaiKey: "sk-test-key",
        anthropicKey: "sk-ant-test-key",
      });

      const expectedDebate = {
        id: "debate-123",
        userId,
        topic: createDto.topic,
        status: "pending",
        modelsUsed: createDto.models,
        totalCost: 0,
      };

      mockPrismaService.debateSession.create.mockResolvedValue(expectedDebate);

      const result = await service.createDebate(userId, createDto);

      expect(result).toEqual(expectedDebate);
      expect(mockApiKeysService.getUserApiKeys).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.debateSession.create).toHaveBeenCalledWith({
        data: {
          userId,
          topic: createDto.topic,
          status: "pending",
          modelsUsed: createDto.models,
          totalCost: 0,
        },
      });
    });

    it("should throw BadRequestException when no API keys are configured", async () => {
      mockApiKeysService.getUserApiKeys.mockResolvedValue({});

      await expect(service.createDebate(userId, createDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createDebate(userId, createDto)).rejects.toThrow(
        "No API keys configured"
      );
    });
  });

  describe("findAll", () => {
    const userId = "user-123";

    it("should return paginated debate sessions", async () => {
      const mockDebates = [
        {
          id: "debate-1",
          userId,
          topic: "Topic 1",
          status: "completed",
          rounds: [],
        },
        {
          id: "debate-2",
          userId,
          topic: "Topic 2",
          status: "pending",
          rounds: [],
        },
      ];

      mockPrismaService.debateSession.findMany.mockResolvedValue(mockDebates);

      const result = await service.findAll(userId, 20, 0);

      expect(result).toEqual(mockDebates);
      expect(mockPrismaService.debateSession.findMany).toHaveBeenCalledWith({
        where: { userId },
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

    it("should use default pagination values", async () => {
      mockPrismaService.debateSession.findMany.mockResolvedValue([]);

      await service.findAll(userId);

      expect(mockPrismaService.debateSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        })
      );
    });
  });

  describe("findOne", () => {
    const userId = "user-123";
    const debateId = "debate-123";

    it("should return debate session with rounds and messages", async () => {
      const mockDebate = {
        id: debateId,
        userId,
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

      const result = await service.findOne(debateId, userId);

      expect(result).toEqual(mockDebate);
      expect(mockPrismaService.debateSession.findFirst).toHaveBeenCalledWith({
        where: { id: debateId, userId },
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

    it("should throw NotFoundException when debate not found", async () => {
      mockPrismaService.debateSession.findFirst.mockResolvedValue(null);

      await expect(service.findOne(debateId, userId)).rejects.toThrow(
        NotFoundException
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
        "Final prompt"
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
        messageData.latencyMs
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
