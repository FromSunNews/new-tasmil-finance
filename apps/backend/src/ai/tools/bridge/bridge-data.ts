// Bridge data utilities for extracting information from bridge pairs

export type BridgePair = {
  tokenName: string;
  fromChainName: string;
  toChainName: string;
  fromChainId: string;
  toChainId: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromTokenDecimals: number;
  toTokenDecimals: number;
  minValue: {
    rawValue: string;
    uiValue: string;
    decimals: number;
  };
  maxValue: {
    rawValue: string;
    uiValue: string;
    decimals: number;
  };
  contractAddress: string;
};

export type BridgeInfo = {
  tokenName: string;
  fromChain: string;
  toChain: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromDecimals: number;
  toDecimals: number;
  minAmount: string;
  maxAmount: string;
  contractAddress: string;
};

/**
 * Find bridge pair by token and chains
 */
export function findBridgePair(
  pairs: BridgePair[],
  tokenName: string,
  fromChain: string,
  toChain: string
): BridgePair | null {
  return (
    pairs.find(
      (pair) =>
        pair.tokenName === tokenName &&
        pair.fromChainName === fromChain &&
        pair.toChainName === toChain
    ) || null
  );
}

/**
 * Validate bridge amount against limits
 */
export function validateBridgeAmount(
  pair: BridgePair,
  amount: string
): { valid: boolean; error?: string } {
  const amountNum = Number.parseFloat(amount);
  const minAmount = Number.parseFloat(pair.minValue.uiValue);
  const maxAmount = Number.parseFloat(pair.maxValue.uiValue);

  if (Number.isNaN(amountNum)) {
    return { valid: false, error: "Invalid amount format" };
  }

  if (amountNum < minAmount) {
    return {
      valid: false,
      error: `Amount too low. Minimum: ${minAmount} ${pair.tokenName}`,
    };
  }

  if (amountNum > maxAmount) {
    return {
      valid: false,
      error: `Amount too high. Maximum: ${maxAmount} ${pair.tokenName}`,
    };
  }

  return { valid: true };
}

/**
 * Get all available tokens
 */
export function getAvailableTokens(pairs: BridgePair[]): string[] {
  const tokens = new Set(pairs.map((pair) => pair.tokenName));
  return Array.from(tokens);
}

/**
 * Get all available chains
 */
export function getAvailableChains(pairs: BridgePair[]): string[] {
  const chains = new Set([
    ...pairs.map((pair) => pair.fromChainName),
    ...pairs.map((pair) => pair.toChainName),
  ]);
  return Array.from(chains);
}
