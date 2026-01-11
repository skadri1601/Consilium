import { Module } from "@nestjs/common";
import { PersonasController } from "./personas.controller";
import { PersonasService } from "./personas.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PersonasController],
  providers: [PersonasService],
  exports: [PersonasService],
})
export class PersonasModule {}

