import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { AuthService } from '../auth.service';
import { AuditLoggerService } from '../../../shared/services/audit-logger.service';
import { SessionService } from '../../../shared/services/session.service';
import { CliTokenService } from '../services/cli-token.service';

const mockAuditLogger = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockSessionService = {
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
  isIdle: jest.fn().mockResolvedValue(false),
  updateActivity: jest.fn().mockResolvedValue(undefined),
  generateFingerprint: jest.fn().mockReturnValue('mock-fingerprint'),
  validateSessionFingerprint: jest.fn().mockResolvedValue(true),
};

const mockCliTokenService = {
  generate: jest.fn(),
  validate: jest.fn().mockResolvedValue(null),
};

const mockRedis = {
  status: 'ready',
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  sadd: jest.fn().mockResolvedValue(1),
  scard: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
};

const createMockContext = (
  headers: Record<string, string> = {},
  query: Record<string, string> = {},
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers,
        query,
        ip: '127.0.0.1',
      }),
    }),
  }) as ExecutionContext;

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkAuthGuard,
        {
          provide: AuthService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: CliTokenService,
          useValue: mockCliTokenService,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: mockRedis,
        },
      ],
    }).compile();

    guard = module.get<ClerkAuthGuard>(ClerkAuthGuard);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockSessionService.isTokenBlacklisted.mockResolvedValue(false);
    mockSessionService.isIdle.mockResolvedValue(false);
    mockSessionService.generateFingerprint.mockReturnValue('mock-fingerprint');
    mockSessionService.validateSessionFingerprint.mockResolvedValue(true);
    mockRedis.status = 'ready';
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.scard.mockResolvedValue(1);
    mockRedis.smembers.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid token', async () => {
      jest.spyOn(authService, 'verifyToken').mockResolvedValue({
        sub: 'user-123',
        sid: 'session-456',
      } as any);

      const context = createMockContext({
        authorization: 'Bearer valid-token',
        'user-agent': 'test-agent',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for missing authorization header', async () => {
      const context = createMockContext({ 'user-agent': 'test-agent' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jest.spyOn(authService, 'verifyToken').mockResolvedValue(null);

      const context = createMockContext({
        authorization: 'Bearer invalid-token',
        'user-agent': 'test-agent',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should attach user to request', async () => {
      const mockRequest: Record<string, any> = {
        headers: {
          authorization: 'Bearer valid-token',
          'user-agent': 'test-agent',
        },
        query: {},
        ip: '127.0.0.1',
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      jest.spyOn(authService, 'verifyToken').mockResolvedValue({
        sub: 'user-123',
        sid: 'session-456',
      } as any);

      await guard.canActivate(context);

      expect(mockRequest['user']).toEqual({
        userId: 'user-123',
        sessionId: 'session-456',
      });
    });
  });
});
