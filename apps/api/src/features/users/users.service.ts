import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuthService } from "../auth/auth.service";

const VALID_MODES = new Set([
  "quick",
  "council",
  "deep",
  "blind",
  "redteam",
  "jury",
  "market",
  "auto",
]);

const DEFAULT_PREFERENCES = {
  defaultAgents: [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "llama-3.1-8b-instant",
  ],
  defaultMode: "council",
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async findByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async getPreferences(clerkId: string) {
    const clerkUser = await this.authService.getUser(clerkId);
    if (!clerkUser) {
      return DEFAULT_PREFERENCES;
    }

    const meta = (clerkUser.unsafeMetadata || {}) as Record<string, unknown>;

    const rawMode = meta.defaultMode as string | undefined;
    const defaultMode =
      rawMode === "visible"
        ? "council"
        : rawMode && VALID_MODES.has(rawMode)
          ? rawMode
          : DEFAULT_PREFERENCES.defaultMode;

    const defaultAgents =
      Array.isArray(meta.defaultAgents) && meta.defaultAgents.length > 0
        ? (meta.defaultAgents as string[])
        : DEFAULT_PREFERENCES.defaultAgents;

    return { defaultAgents, defaultMode };
  }

  async findOrCreate(
    clerkId: string,
    email: string,
    data?: Partial<UpdateUserDto>,
  ) {
    return this.prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email,
        tenantId: clerkId,
        ...data,
      },
      update: data || {},
    });
  }

  async update(clerkId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { clerkId },
      data: dto,
    });
  }
}
