import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async findOrCreate(clerkId: string, email: string, data?: Partial<UpdateUserDto>) {
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
