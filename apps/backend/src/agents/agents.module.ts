import { Module, forwardRef } from "@nestjs/common";
import { AgentRegistryService } from "./agent-registry.service";
import { AgentsController } from "./agents.controller";
import { StakingAgentModule } from "./staking/staking-agent.module";

@Module({
  imports: [forwardRef(() => StakingAgentModule)],
  providers: [AgentRegistryService],
  exports: [AgentRegistryService],
  controllers: [AgentsController],
})
export class AgentsModule {}

