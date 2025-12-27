import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { BridgeAgentService } from "./bridge-agent.service";
import { BridgeModule } from "../../ai/tools/bridge/bridge.module";
import { AgentsModule } from "../agents.module";
import { AgentRegistryService } from "../agent-registry.service";

@Module({
  imports: [BridgeModule, forwardRef(() => AgentsModule)],
  providers: [BridgeAgentService],
  exports: [BridgeAgentService],
})
export class BridgeAgentModule implements OnModuleInit {
  constructor(
    private bridgeAgentService: BridgeAgentService,
    private agentRegistry: AgentRegistryService
  ) {}

  onModuleInit() {
    // Auto-register bridge agent on module initialization
    this.agentRegistry.registerAgent(this.bridgeAgentService);
  }
}
