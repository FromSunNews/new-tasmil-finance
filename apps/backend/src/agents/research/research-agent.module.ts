import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { ResearchAgentService } from "./research-agent.service";
import { ResearchModule } from "../../ai/tools/research/research.module";
import { AgentsModule } from "../agents.module";
import { AgentRegistryService } from "../agent-registry.service";

@Module({
  imports: [ResearchModule, forwardRef(() => AgentsModule)],
  providers: [ResearchAgentService],
  exports: [ResearchAgentService],
})
export class ResearchAgentModule implements OnModuleInit {
  constructor(
    private researchAgentService: ResearchAgentService,
    private agentRegistry: AgentRegistryService
  ) {}

  onModuleInit() {
    // Auto-register research agent on module initialization
    this.agentRegistry.registerAgent(this.researchAgentService);
  }
}
