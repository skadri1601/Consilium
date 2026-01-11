import { Injectable, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreateWaitlistDto } from "./dto/create-waitlist.dto";

@Injectable()
export class WaitlistService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWaitlistDto) {
    // Check if email already exists
    const existing = await this.prisma.waitlist.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException("Email already on waitlist");
    }

    // Create waitlist entry
    const waitlist = await this.prisma.waitlist.create({
      data: {
        email: dto.email,
        source: dto.source || "landing_page",
        metadata: dto.metadata || {},
      },
    });

    return {
      success: true,
      message: "Successfully joined waitlist",
      id: waitlist.id,
    };
  }

  async findAll() {
    return this.prisma.waitlist.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async markNotified(email: string) {
    return this.prisma.waitlist.update({
      where: { email },
      data: { notified: true },
    });
  }
}

