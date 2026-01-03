import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgentDto, userId: string) {
    return this.prisma.agent.create({
      data: {
        ...dto,
        userId,
        tenantId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.agent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async update(id: string, dto: UpdateAgentDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.agent.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.agent.delete({
      where: { id },
    });
  }
}
