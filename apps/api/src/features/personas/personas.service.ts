import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { CreatePersonaDto } from "./dto/create-persona.dto";
import { UpdatePersonaDto } from "./dto/update-persona.dto";

@Injectable()
export class PersonasService {
  constructor(private prisma: PrismaService) {}

  private async resolveUserId(clerkId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException(
        "User not found. Please ensure your account is synced."
      );
    }

    return user.id;
  }

  async create(clerkId: string, dto: CreatePersonaDto) {
    const userId = await this.resolveUserId(clerkId);

    return this.prisma.agentPersona.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async findAll(clerkId: string) {
    const userId = await this.resolveUserId(clerkId);

    return this.prisma.agentPersona.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async findOne(id: string, clerkId: string) {
    const userId = await this.resolveUserId(clerkId);

    const persona = await this.prisma.agentPersona.findFirst({
      where: { id, userId },
    });

    if (!persona) {
      throw new NotFoundException("Persona not found");
    }

    return persona;
  }

  async update(id: string, clerkId: string, dto: UpdatePersonaDto) {
    await this.findOne(id, clerkId);

    return this.prisma.agentPersona.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, clerkId: string) {
    await this.findOne(id, clerkId);

    return this.prisma.agentPersona.delete({
      where: { id },
    });
  }
}

