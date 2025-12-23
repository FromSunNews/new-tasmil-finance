import { Module } from "@nestjs/common";
import { ToolsService } from "./tools.service";
import { AiModule } from "../ai.module";

@Module({
  imports: [AiModule],
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}

