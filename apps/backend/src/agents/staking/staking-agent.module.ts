import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { StakingAgentService } from "./staking-agent.service";
import { StakingModule } from "../../ai/tools/staking/staking.module";
import { AgentsModule } from "../agents.module";
import { AgentRegistryService } from "../agent-registry.service";

@Module({
  imports: [StakingModule, forwardRef(() => AgentsModule)],
  providers: [StakingAgentService],
  exports: [StakingAgentService],
})
export class StakingAgentModule implements OnModuleInit {
  constructor(
    private stakingAgentService: StakingAgentService,
    private agentRegistry: AgentRegistryService
  ) {}

  onModuleInit() {
    // Auto-register staking agent on module initialization
    this.agentRegistry.registerAgent(this.stakingAgentService);
  }
}

