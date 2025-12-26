import { Injectable } from "@nestjs/common";
import type { IAgent } from "./interfaces/agent.interface";
import type { JwtPayload } from "../auth/auth.service";
import type { UIMessageStreamWriter } from "ai";
import type { ChatMessage } from "@repo/api";

@Injectable()
export class AgentRegistryService {
  private agents = new Map<string, IAgent>();

  registerAgent(agent: IAgent): void {
    const id = agent.getId();
    if (this.agents.has(id)) {
      console.warn(`Agent with id "${id}" is already registered. Overwriting...`);
    }
    this.agents.set(id, agent);
    console.log(`✅ Registered agent: ${agent.getName()} (${id})`);
  }

  getAgent(agentId: string): IAgent | null {
    return this.agents.get(agentId) || null;
  }

  getAllAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  getToolsForAgent(
    agentId: string,
    user: JwtPayload,
    walletAddress?: string,
    dataStream?: UIMessageStreamWriter<ChatMessage>
  ): Record<string, any> | null {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return null;
    }
    return agent.getTools(user, walletAddress, dataStream);
  }
}

