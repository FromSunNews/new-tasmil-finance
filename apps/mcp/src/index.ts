#!/usr/bin/env node

/**
 * MCP Server for DeFi Operations on U2U Solaris
 * 
 * This server implements 31 tools across 3 specialized agents:
 * - Owlto Agent: Cross-chain bridging (2 tools)
 * - U2 Staking Agent: Staking operations (10 tools)
 * - Insight Agent: Analytics and queries (19 tools)
 * 
 * All tools use core infrastructure functions: build_txn, submit_txn, query
 */

import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Import tool schemas and handlers
import { owltoToolSchemas, handleOwltoToolCall } from './tools/owlto.js';
import { u2uStakingToolSchemas, handleU2UStakingToolCall } from './tools/u2u-staking.js';
import { insightToolSchemas, handleInsightToolCall } from './tools/insight.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'u2u-defi-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Register all tool schemas
 */
const allToolSchemas = [
  ...owltoToolSchemas,
  ...u2uStakingToolSchemas,
  ...insightToolSchemas,
];

// Define Schemas for Request Handling
const ListToolsRequestSchema = z.object({
  method: z.literal("tools/list"),
  params: z.object({
    cursor: z.string().optional(),
  }).optional(),
});

const CallToolRequestSchema = z.object({
  method: z.literal("tools/call"),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.unknown()).optional(),
  }),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allToolSchemas,
  };
});

/**
 * Register single consolidated tool handler
 * All tools from all agents are handled here
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  
  // Route to appropriate agent handler based on tool prefix
  if (toolName.startsWith('owlto_')) {
    return handleOwltoToolCall(request);
  }
  
  if (toolName.startsWith('u2u_staking_')) {
    return handleU2UStakingToolCall(request);
  }
  
  if (toolName.startsWith('insight_')) {
    return handleInsightToolCall(request);
  }
  
  throw new Error(`Unknown tool: ${toolName}`);
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('U2U DeFi MCP Server started successfully');
  console.error('Registered tools:');
  console.error(`  - Owlto Agent: ${owltoToolSchemas.length} tools`);
  console.error(`  - U2 Staking Agent: ${u2uStakingToolSchemas.length} tools`);
  console.error(`  - Insight Agent: ${insightToolSchemas.length} tools`);
  console.error(`  - Total: ${allToolSchemas.length} tools`);
}

main().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
