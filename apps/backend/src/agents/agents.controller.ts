import { Controller, Get, Param, HttpException, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { AgentRegistryService } from "./agent-registry.service";
import { ChatSDKError } from "@repo/api";

@ApiTags("agents")
@Controller("agents")
export class AgentsController {
  constructor(private agentRegistry: AgentRegistryService) {}

  @Get()
  @ApiOperation({ summary: "Get all available agents" })
  @ApiResponse({ status: 200, description: "List of agents" })
  getAllAgents() {
    const agents = this.agentRegistry.getAllAgents();
    return agents.map((agent) => ({
      id: agent.getId(),
      name: agent.getName(),
      description: agent.getDescription(),
      type: agent.getType(),
      icon: agent.getIcon(),
      supportedChains: agent.getSupportedChains(),
    }));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get agent by ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Agent retrieved" })
  @ApiResponse({ status: 404, description: "Agent not found" })
  getAgent(@Param("id") id: string) {
    const agent = this.agentRegistry.getAgent(id);
    if (!agent) {
      throw new HttpException(
        new ChatSDKError("not_found:agent"),
        HttpStatus.NOT_FOUND
      );
    }
    return {
      id: agent.getId(),
      name: agent.getName(),
      description: agent.getDescription(),
      type: agent.getType(),
      icon: agent.getIcon(),
      supportedChains: agent.getSupportedChains(),
    };
  }
}

