import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest } from "next/server";

const LANGGRAPH_URL = process.env['NEXT_PUBLIC_API_URL'] || "http://localhost:8001";

// 1. Service adapter for multi-agent support
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime instance with LangGraph agent
// Note: All agents point to the same backend - the backend handles routing
const runtime = new CopilotRuntime({
  agents: {
    // Main agent - backend only has staking_agent for now
    staking_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/`,
    }),
  },
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
