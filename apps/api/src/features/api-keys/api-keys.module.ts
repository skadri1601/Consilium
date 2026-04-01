import { Module } from "@nestjs/common";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { EncryptionService } from "../../shared/services/encryption.service";
import { PrismaModule } from "../../shared/database/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { RateLimitGuard } from "../../shared/guards/rate-limit.guard";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, EncryptionService, RateLimitGuard],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
