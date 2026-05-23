import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreateShareDto } from "./dto/create-share.dto";

const TOKEN_BYTES = 16;
const DEFAULT_WEB_BASE_URL = "http://localhost:3000";

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private webBaseUrl(): string {
    const fromEnv =
      this.config.get<string>("WEB_BASE_URL") ||
      this.config.get<string>("FRONTEND_URL") ||
      process.env.WEB_BASE_URL ||
      process.env.FRONTEND_URL;
    return (fromEnv || DEFAULT_WEB_BASE_URL).replace(/\/$/, "");
  }

  private buildUrl(token: string): string {
    return `${this.webBaseUrl()}/share/${token}`;
  }

  private generateToken(): string {
    return randomBytes(TOKEN_BYTES).toString("base64url");
  }

  async createShare(userId: string, sessionId: string, dto: CreateShareDto) {
    const token = this.generateToken();
    const expiresAt =
      dto.expiresIn && dto.expiresIn > 0
        ? new Date(Date.now() + dto.expiresIn * 60 * 60 * 1000)
        : null;

    const record = await this.prisma.sessionShare.create({
      data: {
        token,
        sessionId,
        userId,
        isPublic: dto.public ?? false,
        expiresAt,
        payload: (dto.payload ?? {}) as object,
      },
    });

    return {
      id: record.id,
      token: record.token,
      shareId: record.id,
      url: this.buildUrl(record.token),
      expiresAt: record.expiresAt ?? null,
      public: record.isPublic,
    };
  }

  async getShare(token: string, requesterId?: string) {
    const record = await this.prisma.sessionShare.findUnique({
      where: { token },
    });

    if (!record) {
      throw new NotFoundException("Share not found");
    }

    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException("Share has expired");
    }

    if (!record.isPublic) {
      if (!requesterId) {
        throw new UnauthorizedException("Authentication required");
      }
      if (requesterId !== record.userId) {
        throw new ForbiddenException("You do not own this share");
      }
    }

    const updated = await this.prisma.sessionShare.update({
      where: { id: record.id },
      data: { views: { increment: 1 } },
    });

    return {
      id: updated.id,
      token: updated.token,
      sessionId: updated.sessionId,
      isPublic: updated.isPublic,
      expiresAt: updated.expiresAt ?? null,
      views: updated.views,
      payload: updated.payload,
      createdAt: updated.createdAt,
    };
  }

  async deleteShare(userId: string, shareId: string) {
    const record = await this.prisma.sessionShare.findUnique({
      where: { id: shareId },
    });

    if (!record) {
      throw new NotFoundException("Share not found");
    }

    if (record.userId !== userId) {
      throw new ForbiddenException("You do not own this share");
    }

    await this.prisma.sessionShare.delete({ where: { id: shareId } });
  }
}
