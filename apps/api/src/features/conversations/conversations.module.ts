import { Module } from "@nestjs/common";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { ConversationV2Controller } from "./conversation-v2.controller";
import { ConversationV2Service } from "./conversation-v2.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ConversationsController, ConversationV2Controller],
  providers: [ConversationsService, ConversationV2Service],
  exports: [ConversationsService, ConversationV2Service],
})
export class ConversationsModule {}
