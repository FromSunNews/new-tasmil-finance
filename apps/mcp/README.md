# U2U DeFi MCP Server

Model Context Protocol (MCP) server for DeFi operations on U2U Solaris network.

## Overview

This MCP server provides 31 tools across 3 specialized agents for blockchain interactions:

### Agents

1. **Owlto Agent** (`owlto_agent`) - Cross-chain bridging (2 tools)
   - `owlto_get_bridge_routes` - Get available bridge pairs
   - `owlto_bridge_tokens` - Execute bridge transactions

2. **U2 Staking Agent** (`u2_staking_agent`) - Staking operations (10 tools)
   - Transaction tools: delegate, undelegate, claim_rewards, restake_rewards, lock_stake
   - Query tools: get_user_stake, get_unlocked_stake, get_pending_rewards, get_rewards_stash, get_lockup_info

3. **Insight Agent** (`insight_agent`) - Analytics and queries (19 tools)
   - ERC20 token queries (6 tools)
   - Network-level queries (5 tools)
   - Validator queries (5 tools)
   - User staking queries (3 tools)

## Architecture

### Core Infrastructure

All tools use three core infrastructure functions:

- **`build_txn()`** - Build transaction data for user signing
- **`submit_txn()`** - Submit signed transaction to blockchain
- **`query()`** - Perform read-only contract calls

These functions are located in `src/utils/blockchain.ts` and provide the foundation for all blockchain interactions.

### Directory Structure

```
apps/mcp/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   ├── tools/
│   │   ├── owlto.ts          # Owlto bridge tools (2 tools)
│   │   ├── u2u-staking.ts    # U2U staking tools (10 tools)
│   │   └── insight.ts        # Insight analytics tools (19 tools)
│   ├── utils/
│   │   ├── blockchain.ts     # Core infrastructure (build_txn, submit_txn, query)
│   │   ├── chains.ts         # Chain configurations
│   │   ├── client.ts         # Viem client creation
│   │   └── contracts.ts      # Contract ABIs and addresses
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

```bash
cd apps/mcp
npm install
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## Usage

This MCP server is designed to be used with MCP-compatible clients. It communicates via stdio transport.

### Tool Naming Convention

All tools use protocol-specific prefixes to support future multi-protocol expansion:

- `owlto_*` - Owlto Bridge protocol tools
- `u2u_staking_*` - U2U Solaris staking tools
- `insight_*` - Analytics and query tools

This naming convention allows adding other protocols (e.g., `aave_*`, `uniswap_*`) in the future.

## Configuration

### Supported Networks

- **U2U Solaris Mainnet** (Chain ID: 39)
- **U2U Nebulas Testnet** (Chain ID: 2484)
- Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Avalanche (for bridging)

### Contract Addresses

- **SFC (Staking)**: `0xfc00face00000000000000000000000000000000`

## Integration Guide

### For Backend Developers

1. **Understanding Tool Structure**: Each tool is a standalone function that can execute independently
2. **Core Functions**: All transaction tools use `build_txn()`, all queries use `query()`
3. **Protocol-Specific Naming**: Tools are prefixed by protocol for easy identification
4. **Agent Separation**: Tools are organized by agent responsibility

### For AI Developers

1. **Agent Coordination**: Tools are grouped by agent (Owlto, U2 Staking, Insight)
2. **Tool Discovery**: Use `tools/list` to get all available tools
3. **Tool Execution**: Call `tools/call` with tool name and arguments
4. **Error Handling**: All tools return `{ success: boolean, ... }` format

## Security

- Server never handles private keys
- All transactions require user wallet confirmation
- Input validation on all parameters
- Read-only queries for analytics

## Future Enhancements

- [ ] Complete Owlto SDK integration for bridge tools
- [ ] Add GraphQL integration for validator data
- [ ] Implement network-level query tools
- [ ] Add support for more staking protocols
- [ ] Add transaction simulation tools

## License

Private - Part of Tasmil Finance project
