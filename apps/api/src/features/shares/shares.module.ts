import { Module } from "@nestjs/common";
import { PrismaModule } from "../../shared/database/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { SharesService } from "./shares.service";
import {
  OptionalClerkAuthGuard,
  SessionSharesController,
  SharesController,
} from "./shares.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SessionSharesController, SharesController],
  providers: [SharesService, OptionalClerkAuthGuard],
  exports: [SharesService],
})
export class SharesModule {}
