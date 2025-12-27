import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { YieldAgentService } from "./yield-agent.service";
import { YieldModule } from "../../ai/tools/yield/yield.module";
import { AgentsModule } from "../agents.module";
import { AgentRegistryService } from "../agent-registry.service";

@Module({
  imports: [YieldModule, forwardRef(() => AgentsModule)],
  providers: [YieldAgentService],
  exports: [YieldAgentService],
})
export class YieldAgentModule implements OnModuleInit {
  constructor(
    private yieldAgentService: YieldAgentService,
    private agentRegistry: AgentRegistryService
  ) {}

  onModuleInit() {
    // Auto-register yield agent on module initialization
    this.agentRegistry.registerAgent(this.yieldAgentService);
  }
}
