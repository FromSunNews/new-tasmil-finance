# U2U DeFi MCP Server

Model Context Protocol (MCP) server for DeFi operations on U2U Solaris network, built with Express and the official MCP SDK.

## Overview

This MCP server provides **31+ tools** across multiple specialized agents for blockchain interactions:

### Agents

1. **Transaction Agent** (Infrastructure)
   - `build_transaction` - Build raw transaction objects
   - `submit_transaction` - Submit signed transactions
   - `query_contract` - Read-only contract calls
   - `get_supported_chains` - List supported networks

2. **Owlto Agent** (`owlto_agent`) - Cross-chain bridging
   - `owlto_get_bridge_routes` - Get available bridge pairs
   - `owlto_bridge_tokens` - Execute bridge transactions

3. **U2 Staking Agent** (`u2_staking_agent`) - Staking operations
   - **Transaction Tools**: `u2u_staking_delegate`, `u2u_staking_undelegate`, `u2u_staking_claim_rewards`, `u2u_staking_restake_rewards`, `u2u_staking_lock_stake`
   - **Query Tools**: `u2u_staking_get_user_stake`, `u2u_staking_get_unlocked_stake`, `u2u_staking_get_pending_rewards`, etc.

4. **Insight Agent** (`insight_agent`) - Analytics and queries
   - Token information & balances
   - Market data (price, cap, volume)
   - Liquidity pool search
   - Network stats

## Architecture

This server uses **Express.js** as the transport layer (`StreamableHTTPServerTransport`) for the MCP protocol, allowing it to be deployed as a standard HTTP web service.

### Directory Structure

```
apps/mcp/
├── server.ts             # Main Express + MCP server entry point
├── index.ts              # Blockchain utility exports (build_txn, submit_txn)
├── chains.ts             # Chain configurations
├── client.ts             # Viem client implementation
├── src/
│   ├── tools/
│   │   ├── owlto.ts          # Owlto registration & logic
│   │   ├── u2u-staking.ts    # U2U Staking registration & logic
│   │   └── insight.ts        # Insight registration & logic
│   └── utils/
│       ├── blockchain.ts     # (Legacy/Reference)
│       └── contracts.ts      # Contract ABIs
```

## Installation

```bash
cd apps/mcp
pnpm install
```

## Development

```bash
# Build the project
pnpm build

# Run the server (default port 3008)
pnpm start
```

## Configuration

The server runs on **port 3008** by default. It exposes an MCP-compliant endpoint at `POST /mcp`.

- **U2U Solaris Mainnet**: Chain ID 39
- **RPC URL**: `https://rpc-mainnet.u2u.xyz`

## Integration

Unlike stdio-based MCP servers, this server runs over HTTP. Clients should connect via SSE (Server-Sent Events) or direct POST requests depending on the transport configuration.

### Tool Naming Convention
Tools are prefixed by protocol/domain to ensure uniqueness:
- `owlto_*`
- `u2u_staking_*`
- `insight_*`

## Future Roadmap

- [ ] Full Owlto SDK integration
- [ ] Real-time market data integration for Insight agent
- [ ] Enhanced validation for staking parameters
- [ ] Transaction simulation support
