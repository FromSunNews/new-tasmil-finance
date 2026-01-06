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
   - `simulate_transaction` - Simulate a transaction

2. **Owlto Agent** (`owlto_agent`) - Cross-chain bridging
   - `owlto_get_bridge_routes` - Get available bridge pairs
   - `owlto_bridge_tokens` - Execute bridge transactions

3. **U2 Staking Agent** (`u2_staking_agent`) - Staking operations
   - **Transaction Tools**: `u2u_staking_delegate`, `u2u_staking_undelegate`, `u2u_staking_claim_rewards`, `u2u_staking_restake_rewards`, `u2u_staking_lock_stake`
   - **Query Tools**: `u2u_staking_get_user_stake`, `u2u_staking_get_unlocked_stake`, `u2u_staking_get_pending_rewards`, `u2u_staking_get_rewards_stash`, `u2u_staking_get_lockup_info`

4. **Insight Agent** (`insight_agent`) 
   - `insight_get_token_info`
   - `insight_get_token_price`
   - `insight_get_token_balance`
   - `insight_get_gas_price`
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

## Recent Updates

- **Transaction Simulation**: Added `simulate_transaction` tool to verify transactions (using `eth_estimateGas`) before submission.
- **Robust Price Data**: Switched to **CryptoCompare** as primary source for token prices (e.g., U2U) with CoinGecko as backup, removing unreliable DexScreener fallback.
- **Stability**: Fixed BigInt serialization issues in staking tools to ensure correct JSON responses.

## Usage with Claude Desktop

To verify the MCP server logic directly within Claude Desktop:

### 1. Configuration
Ensure your `claude_desktop_config.json` points to the build:
```json
{
  "mcpServers": {
    "u2u_defi": {
      "command": "node",
      "args": ["/absolute/path/to/apps/mcp/dist/server.js", "--stdio"]
    }
  }
}
```

### 2. Verification Flow (Copy-Paste)

You can ask Claude to run this entire test sequence to verify the server handles the full lifecycle of a transaction:

> **"Please run a full test of the U2U Staking flow:**
> 1. **Check Balance**: Get the native U2U balance for `0x7378Ee97ed71210dbFE60E4bb7d3bc5612f439e7`.
> 2. **Build Delegation**: Create a transaction to stake 10^-10 U2U to validator 1.
> 3. **Simulate**: Take the transaction data from step 2 and simulate it using `simulate_transaction` to verify it will succeed and check the gas estimate.
> 4. **Report**: Summarize the gas estimate and validity."

This flow confirms that the server can Read (Balance), Write (Build), and Verify (Simulate) correctly.

## Future Roadmap

- [x] Full Owlto SDK integration
- [x] Real-time market data integration for Insight agent
- [x] Enhanced validation for staking parameters
- [x] Transaction simulation support
- [ ] Integration with hardware wallets (Ledger/Trezor) via specialized client


