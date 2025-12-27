import { Module, forwardRef } from "@nestjs/common";
import { AgentRegistryService } from "./agent-registry.service";
import { AgentsController } from "./agents.controller";
import { StakingAgentModule } from "./staking/staking-agent.module";
import { ResearchAgentModule } from "./research/research-agent.module";
import { YieldAgentModule } from "./yield/yield-agent.module";

@Module({
  imports: [
    forwardRef(() => StakingAgentModule),
    forwardRef(() => ResearchAgentModule),
    forwardRef(() => YieldAgentModule),
  ],
  providers: [AgentRegistryService],
  exports: [AgentRegistryService],
  controllers: [AgentsController],
})
export class AgentsModule {}

