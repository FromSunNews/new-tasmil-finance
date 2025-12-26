import { Injectable } from "@nestjs/common";
import type { IAgent } from "../interfaces/agent.interface";
import type { JwtPayload } from "../../auth/auth.service";
import type { UIMessageStreamWriter } from "ai";
import type { ChatMessage } from "@repo/api";
import { StakingQueryService } from "../../ai/tools/staking/staking-query.service";
import { StakingOperationsService } from "../../ai/tools/staking/staking-operations.service";
import { stakingPrompt } from "../../ai/prompts";

@Injectable()
export class StakingAgentService implements IAgent {
  constructor(
    private stakingQueryService: StakingQueryService,
    private stakingOperationsService: StakingOperationsService
  ) {}

  getId(): string {
    return "staking";
  }

  getName(): string {
    return "Staking Agent";
  }

  getDescription(): string[] {
    return [
      "Query staking information on U2U Solaris network",
      "Delegate, undelegate, claim rewards, and manage your staking",
      "Get validator information and network statistics",
    ];
  }

  getType(): "Strategy" | "Intelligence" {
    return "Strategy";
  }

  getIcon(): string {
    return "/sidebar/staking-agent.png";
  }

  getSupportedChains(): string[] {
    return ["U2U Solaris"];
  }

  getTools(
    user: JwtPayload,
    walletAddress?: string,
    dataStream?: UIMessageStreamWriter<ChatMessage>
  ): Record<string, any> {
    const queryTools = this.stakingQueryService.getAllTools(walletAddress);
    const operationTools = this.stakingOperationsService.getAllTools();

    return {
      ...queryTools,
      ...operationTools,
    };
  }

  getSystemPrompt(): string {
    return stakingPrompt;
  }
}

