"use client";

import { ArrowRight, AlertCircle, Clock, Link2, Zap } from "lucide-react";

interface BridgeResultCardProps {
  toolName: string;
  args?: Record<string, any>;
  result: string | null;
  status: "pending" | "executing" | "complete" | "error";
}

// Get chain display name
const getChainDisplayName = (chain: string): string => {
  return chain?.replace("Mainnet", "").replace("Solaris", "") || "Unknown";
};

// Bridge Pairs Result
const BridgePairsResult = ({ data }: { data: any }) => {
  const pairs = data.pairs || [];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link2 className="h-4 w-4 text-primary" />
        Available bridge routes ({data.totalPairs || pairs.length} found)
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
                <div className="font-medium">{pair.minValue?.uiValue || pair.minValue || "N/A"}</div>
              </div>
              <div className="bg-muted/30 rounded p-1.5">
                <div className="text-muted-foreground">Max</div>
                <div className="font-medium">{pair.maxValue?.uiValue || pair.maxValue || "N/A"}</div>
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
  const quote = data.quote || data;
  
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
        
        {(quote.minAmount || quote.maxAmount) && (
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
        )}
        
        {quote.estimatedFeeFormatted && (
          <div className="text-sm">
            <span className="text-muted-foreground">Estimated Fee:</span>
            <span className="ml-2 font-medium">{quote.estimatedFeeFormatted}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Estimated time: {quote.estimatedTime || "~30 seconds"}
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
        {data.totalChains || chains.length} chains supported for bridging
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {chains.map((chain: any, index: number) => (
          <div key={index} className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="font-medium text-sm">{chain.displayName || chain.name || chain}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading state
const LoadingState = ({ toolName }: { toolName: string }) => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <span>Fetching {toolName.replace(/_/g, " ")}...</span>
  </div>
);

// Error state
const ErrorState = ({ error }: { error: string }) => (
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

export function BridgeResultCard({ toolName, result, status }: BridgeResultCardProps) {
  if (status === "executing" || status === "pending") {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <LoadingState toolName={toolName} />
      </div>
    );
  }

  if (!result) return null;

  // Parse result if it's a string
  let data: any;
  try {
    data = typeof result === "string" ? JSON.parse(result) : result;
  } catch {
    data = { raw: result };
  }

  if (data.error || data.success === false) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <ErrorState error={data.error || "Operation failed"} />
      </div>
    );
  }

  const renderContent = () => {
    switch (toolName) {
      case "get_bridge_pairs":
        return <BridgePairsResult data={data} />;
      case "get_bridge_quote":
        return <BridgeQuoteResult data={data} />;
      case "get_supported_chains":
        return <SupportedChainsResult data={data} />;
      default:
        return <GenericResult data={data} />;
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {renderContent()}
    </div>
  );
}
