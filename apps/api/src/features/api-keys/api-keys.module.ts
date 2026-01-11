import { Module } from "@nestjs/common";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { EncryptionService } from "../../shared/services/encryption.service";
import { PrismaModule } from "../../shared/database/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, EncryptionService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}

