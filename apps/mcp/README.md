# MCP Transaction Module

This module provides functions for building and submitting blockchain transactions using Viem.

## Supported Chains

| Network | Chain ID | Identifier |
|---------|----------|------------|
| Ethereum Mainnet | 1 | `mainnet` |
| Ethereum Sepolia | 11155111 | `sepolia` |
| Polygon | 137 | `polygon` |
| Polygon Amoy | 80002 | `polygonAmoy` |
| Arbitrum One | 42161 | `arbitrum` |
| Arbitrum Sepolia | 421614 | `arbitrumSepolia` |
| Optimism | 10 | `optimism` |
| Optimism Sepolia | 11155420 | `optimismSepolia` |
| Base | 8453 | `base` |
| Base Sepolia | 84532 | `baseSepolia` |
| BNB Smart Chain | 56 | `bsc` |
| BNB Testnet | 97 | `bscTestnet` |
| Avalanche C-Chain | 43114 | `avalanche` |
| Avalanche Fuji | 43113 | `avalancheFuji` |
| **U2U Solaris Mainnet** | **39** | `u2uMainnet` |
| **U2U Nebulas Testnet** | **2484** | `u2uTestnet` |

## Functions

### `build_txn(params)`

Builds a transaction object from parameters sent by the frontend. This formatted transaction can then be signed by the user's wallet.

**Parameters:**
- `chainId`: **REQUIRED** - Chain ID (e.g., 1 for mainnet, 137 for polygon)
- `to`: Recipient address (`0x${string}`)
- `value`: Amount to send in wei (`bigint`)
- `data?`: Optional transaction data (`0x${string}`)
- `gas?`: Gas limit (`bigint`)
- `gasPrice?`: Gas price for legacy transactions (`bigint`)
- `maxFeePerGas?`: Max fee per gas for EIP-1559 transactions (`bigint`)
- `maxPriorityFeePerGas?`: Priority fee for EIP-1559 transactions (`bigint`)
- `nonce?`: Transaction nonce (`number`)

**Returns:** Transaction object ready to be signed

**Example:**
```typescript
// Build transaction for Polygon
const txData = build_txn({
  chainId: 137, // Polygon
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n, // 1 MATIC
  data: '0x',
});
// Send txData to frontend for signing
```

### `submit_txn(signedTransaction, chainId, rpcUrl?)`

Submits a signed transaction to the blockchain network.

**Parameters:**
- `signedTransaction`: The serialized signed transaction from wallet (`0x${string}`)
- `chainId`: **REQUIRED** - The chain ID (e.g., 1 for mainnet, 137 for polygon)
- `rpcUrl?`: Optional custom RPC URL (defaults to chain's public RPC)

**Returns:** Transaction hash (`Promise<0x${string}>`)

**Example:**
```typescript
import { submit_txn } from './index';

// After frontend signs the transaction and sends it back
const txHash = await submit_txn(
  signedTransaction,
  137, // Polygon
  'https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY' // Optional custom RPC
);

console.log('Transaction submitted:', txHash);
```

### `getClient(chainId, rpcUrl?)`

Gets or creates a cached PublicClient for interacting with the blockchain.

**Parameters:**
- `chainId`: **REQUIRED** - The chain ID (e.g., 1 for mainnet, 137 for polygon)
- `rpcUrl?`: Optional custom RPC URL

**Returns:** `PublicClient` instance

**Example:**
```typescript
import { getClient } from './index';

const client = getClient(11155111, 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY');
```

### `getChainById(chainId)`

Get chain configuration by chain ID.

**Parameters:**
- `chainId`: The chain ID

**Returns:** `Chain` configuration or `undefined` if not supported

**Example:**
```typescript
import { getChainById } from './index';

const chain = getChainById(137);
console.log(chain.name); // "Polygon"
```

## Workflow

1. **Frontend** sends transaction parameters (including chainId) to backend
2. **Backend** calls `build_txn({ chainId, to, value, ... })` to format the transaction
3. **Backend** sends formatted transaction back to frontend
4. **Frontend** prompts user to sign via wallet popup
5. **Frontend** sends signed transaction + chainId back to backend
6. **Backend** calls `submit_txn(signedTx, chainId)` to broadcast to blockchain
7. **Backend** returns transaction hash to frontend

### Complete Example

**Backend API Endpoint:**
```typescript
import { build_txn, submit_txn } from '@apps/mcp';

// Endpoint 1: Build transaction
app.post('/api/build-transaction', (req, res) => {
  const { chainId, to, value, data } = req.body;
  
  const txData = build_txn({
    chainId: Number(chainId),
    to: to as `0x${string}`,
    value: BigInt(value),
    data: data as `0x${string}`,
  });
  
  res.json({ transaction: txData });
});

// Endpoint 2: Submit signed transaction
app.post('/api/submit-transaction', async (req, res) => {
  const { signedTransaction, chainId, rpcUrl } = req.body;
  
  try {
    const txHash = await submit_txn(
      signedTransaction as `0x${string}`,
      Number(chainId),
      rpcUrl
    );
    
    res.json({ hash: txHash, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});
```

**Frontend Flow:**
```typescript
// Step 1: Get transaction data from backend
const response = await fetch('/api/build-transaction', {
  method: 'POST',
  body: JSON.stringify({
    chainId: 137, // Polygon
    to: '0x...',
    value: '1000000000000000000',
    data: '0x',
  }),
});
const { transaction } = await response.json();

// Step 2: Sign with wallet
const signedTx = await walletClient.signTransaction(transaction);

// Step 3: Submit to backend
const submitResponse = await fetch('/api/submit-transaction', {
  method: 'POST',
  body: JSON.stringify({
    signedTransaction: signedTx,
    chainId: 137,
  }),
});
const { hash } = await submitResponse.json();

console.log('Transaction hash:', hash);
```

## Installation

Viem is already installed as a dependency. No additional installation needed.

```bash
# Already installed via pnpm
viem@^2.21.54
```

