import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreatePersonaDto } from "./dto/create-persona.dto";
import { UpdatePersonaDto } from "./dto/update-persona.dto";

@Injectable()
export class PersonasService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePersonaDto) {
    return (this.prisma as any).agentPersona.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async findAll(userId: string) {
    return (this.prisma as any).agentPersona.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async findOne(id: string, userId: string) {
    const persona = await (this.prisma as any).agentPersona.findFirst({
      where: { id, userId },
    });

    if (!persona) {
      throw new NotFoundException("Persona not found");
    }

    return persona;
  }

  async update(id: string, userId: string, dto: UpdatePersonaDto) {
    await this.findOne(id, userId); // Verify ownership

    return (this.prisma as any).agentPersona.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Verify ownership

    return (this.prisma as any).agentPersona.delete({
      where: { id },
    });
  }
}

