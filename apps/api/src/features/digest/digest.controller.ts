import { Controller, Get, Post, UseGuards, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { DigestService } from "./digest.service";
import { ClerkAuthGuard } from "../auth/guards/clerk-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../auth/decorators/current-user.decorator";
import { PrismaService } from "../../shared/database/prisma.service";

@ApiTags("digest")
@Controller("digest")
export class DigestController {
  constructor(
    private readonly digestService: DigestService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("preview")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Preview weekly digest HTML for current user" })
  @ApiResponse({ status: 200, description: "Digest HTML" })
  async preview(
    @CurrentUser() user: CurrentUserData,
    @Res() reply: FastifyReply,
  ) {
    const dbUser = await this.prisma.user.findUnique({
      where: { clerkId: user.userId },
      select: { id: true, firstName: true },
    });
    const digest = await this.digestService.generateUserDigest(
      dbUser?.id ?? user.userId,
    );
    const html = this.digestService.generateDigestHtml(
      digest,
      dbUser?.firstName ?? undefined,
    );
    reply.header("Content-Type", "text/html");
    reply.send(html);
  }

  @Post("send")
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: "Send weekly digest email (returns HTML for now)" })
  @ApiResponse({ status: 200, description: "Digest data and HTML" })
  async send(@CurrentUser() user: CurrentUserData) {
    const dbUser = await this.prisma.user.findUnique({
      where: { clerkId: user.userId },
      select: { id: true, firstName: true, email: true },
    });
    const digest = await this.digestService.generateUserDigest(
      dbUser?.id ?? user.userId,
    );
    const html = this.digestService.generateDigestHtml(
      digest,
      dbUser?.firstName ?? undefined,
    );
    return { digest, html, recipient: dbUser?.email };
  }
}
