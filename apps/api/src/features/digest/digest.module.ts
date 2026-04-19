import { Module } from "@nestjs/common";
import { DigestController } from "./digest.controller";
import { DigestService } from "./digest.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [DigestController],
  providers: [DigestService],
  exports: [DigestService],
})
export class DigestModule {}
