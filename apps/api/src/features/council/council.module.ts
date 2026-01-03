import { Module } from "@nestjs/common";
import { CouncilController } from "./council.controller";
import { CouncilService } from "./council.service";
import { AgentsModule } from "../agents";

@Module({
  imports: [AgentsModule],
  controllers: [CouncilController],
  providers: [CouncilService],
  exports: [CouncilService],
})
export class CouncilModule {}
