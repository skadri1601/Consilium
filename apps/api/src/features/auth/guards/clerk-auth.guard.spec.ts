import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { AuthService } from '../auth.service';

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let authService: AuthService;

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: 'Bearer valid-token',
        },
      }),
    }),
  } as ExecutionContext;

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
      ],
    }).compile();

    guard = module.get<ClerkAuthGuard>(ClerkAuthGuard);
    authService = module.get<AuthService>(AuthService);
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

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for missing authorization header', async () => {
      const contextWithoutAuth = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithoutAuth)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid token format', async () => {
      const contextWithInvalidFormat = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'InvalidFormat token',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithInvalidFormat)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jest.spyOn(authService, 'verifyToken').mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should attach user to request', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
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

