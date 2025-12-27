"use client";

import { ArrowRight, AlertCircle, Clock, Zap, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BridgeResultProps {
  result: any;
  toolType: string;
}

// Format large numbers
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "N/A";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(4);
};

// Get chain display name
const getChainDisplayName = (chain: string): string => {
  return chain.replace("Mainnet", "").replace("Solaris", "");
};

// Bridge Pairs Result
const BridgePairsResult = ({ data }: { data: any }) => {
  const pairs = data.pairs || [];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link2 className="h-4 w-4 text-primary" />
        Available bridge routes ({data.totalPairs} found)
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {pairs.slice(0, 15).map((pair: any, index: number) => (
          <div key={index} className="border border-border/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary">{pair.tokenName}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-muted px-2 py-1 rounded text-xs">
                {getChainDisplayName(pair.fromChainName)}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="bg-muted px-2 py-1 rounded text-xs">
                {getChainDisplayName(pair.toChainName)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/30 rounded p-1.5">
                <div className="text-muted-foreground">Min</div>
                <div className="font-medium">{pair.minValue?.uiValue || "N/A"}</div>
              </div>
              <div className="bg-muted/30 rounded p-1.5">
                <div className="text-muted-foreground">Max</div>
                <div className="font-medium">{pair.maxValue?.uiValue || "N/A"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Bridge Quote Result
const BridgeQuoteResult = ({ data }: { data: any }) => {
  const quote = data.quote || {};
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Zap className="h-4 w-4 text-yellow-500" />
        Bridge Quote
      </div>
      
      <div className="border border-border/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">From</div>
              <div className="font-medium">{getChainDisplayName(quote.fromChain)}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground">To</div>
              <div className="font-medium">{getChainDisplayName(quote.toChain)}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">
            {quote.amountFormatted || `${quote.amount} ${quote.tokenName}`}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/30 rounded p-2">
            <div className="text-muted-foreground text-xs">Min Amount</div>
            <div className="font-medium">{quote.minAmount}</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-muted-foreground text-xs">Max Amount</div>
            <div className="font-medium">{quote.maxAmount}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Estimated time: {quote.estimatedTime || "~30 seconds"}
        </div>
      </div>
    </div>
  );
};

// Bridge Transaction Result
const BridgeTransactionResult = ({ data }: { data: any }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm mb-2">
        <Zap className="h-4 w-4 text-green-500" />
        <span className="text-green-500 font-medium">Bridge Ready</span>
      </div>
      
      <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">From</div>
              <div className="font-medium">{getChainDisplayName(data.fromChain)}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-green-500" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground">To</div>
              <div className="font-medium">{getChainDisplayName(data.toChain)}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-500">
            {data.amountFormatted}
          </div>
        </div>
        
        {data.requiresWallet && (
          <div className="flex items-center gap-2 text-yellow-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            Please connect your wallet to proceed
          </div>
        )}
        
        {data.requiresConfirmation && (
          <div className="text-sm text-muted-foreground">
            Please confirm the transaction in your wallet when prompted.
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Estimated time: {data.estimatedTime}
        </div>
      </div>
    </div>
  );
};

// Supported Chains Result
const SupportedChainsResult = ({ data }: { data: any }) => {
  const chains = data.chains || [];
  
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-2">
        {data.totalChains} chains supported for bridging
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {chains.map((chain: any, index: number) => (
          <div key={index} className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="font-medium text-sm">{chain.displayName}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Error Result
const ErrorResult = ({ error }: { error: string }) => (
  <div className="flex items-center gap-2 text-red-500">
    <AlertCircle className="h-4 w-4" />
    <span>{error}</span>
  </div>
);

// Generic Result (fallback)
const GenericResult = ({ data }: { data: any }) => {
  const summary = data.success !== undefined ? (
    <div className="text-sm">
      <span className={data.success ? "text-green-500" : "text-red-500"}>
        {data.success ? "✓ Success" : "✗ Failed"}
      </span>
      {data.error && <span className="text-red-500 ml-2">{data.error}</span>}
      {data.message && <div className="text-muted-foreground mt-1">{data.message}</div>}
    </div>
  ) : null;
  
  return (
    <div className="space-y-2">
      {summary}
      <div className="text-xs text-muted-foreground">
        Bridge data received. Check AI response for details.
      </div>
    </div>
  );
};

export function BridgeResult({ result, toolType }: BridgeResultProps) {
  if (!result) return null;
  
  // Handle error
  if (result.error || result.success === false) {
    return (
      <div className="p-4">
        <ErrorResult error={result.error || "Operation failed"} />
      </div>
    );
  }
  
  // Route to specific component based on tool type
  switch (toolType) {
    case "tool-getBridgePairs":
      return (
        <div className="p-4">
          <BridgePairsResult data={result} />
        </div>
      );
    
    case "tool-getBridgeQuote":
      return (
        <div className="p-4">
          <BridgeQuoteResult data={result} />
        </div>
      );
    
    case "tool-bridgeTokens":
      return (
        <div className="p-4">
          <BridgeTransactionResult data={result} />
        </div>
      );
    
    case "tool-getSupportedChains":
      return (
        <div className="p-4">
          <SupportedChainsResult data={result} />
        </div>
      );
    
    default:
      return (
        <div className="p-4">
          <GenericResult data={result} />
        </div>
      );
  }
}
