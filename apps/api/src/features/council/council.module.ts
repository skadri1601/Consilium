import { Module } from "@nestjs/common";
import { CouncilController } from "./council.controller";
import { CouncilService } from "./council.service";
import { AgentsModule } from "../agents";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AgentsModule, AuthModule],
  controllers: [CouncilController],
  providers: [CouncilService],
  exports: [CouncilService],
})
export class CouncilModule {}
