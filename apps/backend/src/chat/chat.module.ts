import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { AiModule } from "../ai/ai.module";
import { ToolsModule } from "../ai/tools/tools.module";

@Module({
  imports: [AiModule, ToolsModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

