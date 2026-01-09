"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/shared/ui/button";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Coins,
  TrendingUp,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import {
  useDelegateStake,
  useUndelegateStake,
  useClaimRewards,
  useRestakeRewards,
  useLockStake,
} from "@/features/staking/hooks/use-staking-operations";
import { useStreamContext } from "@/providers/stream";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";

interface StakingOperationProps {
  toolCallId?: string;
  operation: {
    action: string;
    validatorID: number | string;
    amount?: number | string;
    amountFormatted?: string;
    wrID?: number;
    lockupDuration?: number;
    lockupDurationDays?: number;
    message: string;
    requiresWallet: boolean;
    requiresConfirmation: boolean;
  };
  onSuccess?: (result: {
    hash: string;
    success: boolean;
    message: string;
  }) => void;
  onError?: (error: string) => void;
}

interface TransactionResult {
  success: boolean;
  hash?: string;
  message: string;
  action: string;
  validatorID: string | number;
  amount?: string | number;
  amountFormatted?: string;
  timestamp: string;
}

export function StakingOperation({
  toolCallId,
  operation,
  onSuccess,
  onError,
}: StakingOperationProps) {
  const { address, isConnected } = useAccount();
  const thread = useStreamContext();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<TransactionResult | null>(null);

  // Hooks for different operations
  const delegateStake = useDelegateStake();
  const undelegateStake = useUndelegateStake();
  const claimRewards = useClaimRewards();
  const restakeRewards = useRestakeRewards();
  const lockStake = useLockStake();

  // Check for existing transaction result in local state (component handles its own state)
  // The transaction result is stored in component state and persisted via the UI card itself

  // Get effective toolCallId for saving/restoring state
  const getEffectiveToolCallId = () => {
    if (toolCallId) return toolCallId;
    
    // Find the AI message that has a tool_call matching current operation action
    // Map operation action to tool names (support both short and full action names)
    const actionToToolName: Record<string, string[]> = {
      delegate: ["u2u_staking_delegate", "delegateStake"],
      u2u_staking_delegate: ["u2u_staking_delegate", "delegateStake"],
      undelegate: ["u2u_staking_undelegate", "undelegateStake"],
      u2u_staking_undelegate: ["u2u_staking_undelegate", "undelegateStake"],
      claimRewards: ["u2u_staking_claim_rewards", "claimRewards"],
      u2u_staking_claim_rewards: ["u2u_staking_claim_rewards", "claimRewards"],
      restakeRewards: ["u2u_staking_restake_rewards", "restakeRewards"],
      u2u_staking_restake_rewards: ["u2u_staking_restake_rewards", "restakeRewards"],
      lockStake: ["u2u_staking_lock_stake", "lockStake"],
      u2u_staking_lock_stake: ["u2u_staking_lock_stake", "lockStake"],
    };
    
    const toolNames = actionToToolName[operation.action] || [];
    
    // Find the LAST AI message with a matching tool call (most recent operation)
    for (let i = thread.messages.length - 1; i >= 0; i--) {
      const msg = thread.messages[i];
      if (msg && msg.type === "ai" && (msg as any).tool_calls?.length > 0) {
        const matchingToolCall = (msg as any).tool_calls.find(
          (tc: any) => toolNames.includes(tc.name)
        );
        if (matchingToolCall?.id) {
          return matchingToolCall.id;
        }
      }
    }
    
    return null;
  };

  // Restore state from thread messages on mount
  useEffect(() => {
    if (typeof window === "undefined" || executionResult) return;
    
    const effectiveToolCallId = getEffectiveToolCallId();
    if (!effectiveToolCallId) return;
    
    // Look for saved transaction result in tool messages with matching toolCallId
    const toolResponse = thread.messages.findLast(
      (message) => 
        message.type === "tool" && 
        (message as any).tool_call_id === effectiveToolCallId &&
        (message as any).name === "staking-transaction-result"
    );
    
    if (toolResponse && toolResponse.content) {
      try {
        const content = typeof toolResponse.content === "string" 
          ? toolResponse.content 
          : JSON.stringify(toolResponse.content);
        const parsedContent: TransactionResult = JSON.parse(content);
        
        // Only restore if the action matches current operation (normalize action names)
        const normalizeAction = (action: string) => {
          const actionMap: Record<string, string> = {
            u2u_staking_delegate: 'delegate',
            u2u_staking_undelegate: 'undelegate',
            u2u_staking_claim_rewards: 'claimRewards',
            u2u_staking_restake_rewards: 'restakeRewards',
            u2u_staking_lock_stake: 'lockStake',
          };
          return actionMap[action] || action;
        };
        
        if ((parsedContent.hash || parsedContent.success === false) && 
            normalizeAction(parsedContent.action) === normalizeAction(operation.action)) {
          setExecutionResult(parsedContent);
        }
      } catch {
        console.error("Failed to parse tool response content.");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolCallId, thread.messages, executionResult, operation.action]);

  const saveTransactionResult = (result: TransactionResult) => {
    const effectiveToolCallId = getEffectiveToolCallId();
    
    if (!effectiveToolCallId) {
      console.warn("No toolCallId found, cannot save transaction result");
      return;
    }

    // Explorer URL for transaction
    const explorerUrl = result.hash ? `https://u2uscan.xyz/tx/${result.hash}` : '';

    // Create context message for AI to understand what happened (with markdown URL)
    const contextMessage = result.success 
      ? `✅ WALLET TRANSACTION COMPLETED

**Transaction Details:**
- Action: ${result.action}
- Validator ID: ${result.validatorID}${result.amountFormatted ? `\n- Amount: ${result.amountFormatted}` : ''}
- Transaction Hash: \`${result.hash}\`
- Explorer: [View on U2UScan](${explorerUrl})

Please provide a clear, friendly summary confirming the successful ${result.action} transaction to the user. Include the explorer link so they can verify.`
      : `❌ WALLET TRANSACTION FAILED

**Error Details:**
- Action: ${result.action}
- Validator ID: ${result.validatorID}${result.amountFormatted ? `\n- Amount: ${result.amountFormatted}` : ''}
- Error: ${result.message}

Please explain what went wrong in simple terms and suggest next steps the user can take.`;

    // Submit tool message with transaction result - this will trigger AI to respond
    // because it's a tool response that the agent needs to process
    const toolMessage = {
      type: "tool" as const,
      tool_call_id: effectiveToolCallId,
      id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
      name: "staking-transaction-result",
      content: JSON.stringify({
        ...result,
        explorerUrl,
        contextMessage,
      }),
    };
    
    console.log("[StakingOperation] Sending tool message:", toolMessage);
    
    thread.submit(
      {
        messages: [toolMessage],
      },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
      }
    );
  };

  const handleExecute = async () => {
    if (!isConnected || !address) {
      onError?.("Please connect your wallet first");
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      let result;
      const validatorID = Number(operation.validatorID);
      const amount = String(operation.amount || "0");

      switch (operation.action) {
        case "delegate":
        case "u2u_staking_delegate":
          if (!operation.amount) {
            throw new Error("Amount is required for delegation");
          }
          result = await delegateStake.delegateStake(validatorID, amount);
          break;

        case "undelegate":
        case "u2u_staking_undelegate":
          if (!operation.amount || !operation.wrID) {
            throw new Error(
              "Amount and withdrawal request ID are required for undelegation"
            );
          }
          result = await undelegateStake.undelegateStake(
            validatorID,
            operation.wrID,
            amount
          );
          break;

        case "claimRewards":
        case "u2u_staking_claim_rewards":
          result = await claimRewards.claimRewards(validatorID);
          break;

        case "restakeRewards":
        case "u2u_staking_restake_rewards":
          result = await restakeRewards.restakeRewards(validatorID);
          break;

        case "lockStake":
        case "u2u_staking_lock_stake":
          if (!operation.amount || !operation.lockupDuration) {
            throw new Error(
              "Amount and lockup duration are required for locking stake"
            );
          }
          result = await lockStake.lockStake(
            validatorID,
            operation.lockupDuration,
            amount
          );
          break;

        default:
          throw new Error(`Unsupported operation: ${operation.action}`);
      }

      const transactionResult: TransactionResult = {
        success: true,
        hash: result.hash,
        message: `Transaction successful!`,
        action: operation.action,
        validatorID: operation.validatorID,
        amount: operation.amount || 0,
        amountFormatted: operation.amountFormatted || '',
        timestamp: new Date().toISOString(),
      };

      setExecutionResult(transactionResult);
      saveTransactionResult(transactionResult);
      onSuccess?.({
        hash: result.hash,
        success: true,
        message: transactionResult.message,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      
      const failedResult: TransactionResult = {
        success: false,
        message: errorMessage,
        action: operation.action,
        validatorID: operation.validatorID,
        amount: operation.amount || 0,
        amountFormatted: operation.amountFormatted || '',
        timestamp: new Date().toISOString(),
      };

      setExecutionResult(failedResult);
      // Save failed transaction and trigger AI response for user guidance
      saveTransactionResult(failedResult);
      onError?.(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const getOperationIcon = () => {
    switch (operation.action) {
      case "delegate":
      case "u2u_staking_delegate":
        return <Coins className="h-5 w-5 text-primary" />;
      case "undelegate":
      case "u2u_staking_undelegate":
        return <TrendingUp className="h-5 w-5 text-orange-500" />;
      case "claimRewards":
      case "u2u_staking_claim_rewards":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "restakeRewards":
      case "u2u_staking_restake_rewards":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "lockStake":
      case "u2u_staking_lock_stake":
        return <Lock className="h-5 w-5 text-purple-500" />;
      default:
        return <Coins className="h-5 w-5 text-primary" />;
    }
  };

  const getOperationTitle = () => {
    switch (operation.action) {
      case "delegate":
      case "u2u_staking_delegate":
        return "Delegate Stake";
      case "undelegate":
      case "u2u_staking_undelegate":
        return "Undelegate Stake";
      case "claimRewards":
      case "u2u_staking_claim_rewards":
        return "Claim Rewards";
      case "restakeRewards":
      case "u2u_staking_restake_rewards":
        return "Restake Rewards";
      case "lockStake":
      case "u2u_staking_lock_stake":
        return "Lock Stake";
      default:
        return "Staking Operation";
    }
  };

  const getButtonText = () => {
    if (isExecuting) return "Processing...";
    switch (operation.action) {
      case "delegate":
      case "u2u_staking_delegate":
        return "Stake U2U";
      case "undelegate":
      case "u2u_staking_undelegate":
        return "Unstake U2U";
      case "claimRewards":
      case "u2u_staking_claim_rewards":
        return "Claim Rewards";
      case "restakeRewards":
      case "u2u_staking_restake_rewards":
        return "Restake Rewards";
      case "lockStake":
      case "u2u_staking_lock_stake":
        return "Lock Stake";
      default:
        return "Execute";
    }
  };

  const isPending =
    delegateStake.isPending ||
    undelegateStake.isPending ||
    claimRewards.isPending ||
    restakeRewards.isPending ||
    lockStake.isPending;

  const hasError =
    delegateStake.isError ||
    undelegateStake.isError ||
    claimRewards.isError ||
    restakeRewards.isError ||
    lockStake.isError;

  const errorMessage =
    delegateStake.errorMessage ||
    undelegateStake.errorMessage ||
    claimRewards.errorMessage ||
    restakeRewards.errorMessage ||
    lockStake.errorMessage;

  // Show completed transaction UI
  if (executionResult?.success && executionResult.hash) {
    const truncatedHash = `${executionResult.hash.slice(0, 6)}...${executionResult.hash.slice(-4)}`;
    const explorerUrl = `https://u2uscan.xyz/tx/${executionResult.hash}`;

    return (
      <div className="rounded-lg border bg-card/40 p-6 shadow-sm max-w-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold">Transaction Completed</h3>
            <p className="text-muted-foreground text-sm">
              {getOperationTitle()} was successful
            </p>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Validator ID</span>
            <span className="font-semibold">{executionResult.validatorID}</span>
          </div>
          {executionResult.amount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">
                {executionResult.amountFormatted || `${executionResult.amount} U2U`}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Transaction Hash</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs">{truncatedHash}</span>
              <a
                className="flex h-6 w-6 items-center justify-center rounded-full bg-background/30 transition-colors hover:text-foreground"
                href={explorerUrl}
                rel="noopener noreferrer"
                target="_blank"
                title="View on U2U Explorer"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
          <p className="text-green-700 dark:text-green-300 text-sm">
            {executionResult.message}
          </p>
        </div>
      </div>
    );
  }

  // Show failed transaction UI
  if (executionResult?.success === false) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm max-w-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold">Transaction Failed</h3>
            <p className="text-muted-foreground text-sm">{getOperationTitle()}</p>
          </div>
        </div>

        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 overflow-x-auto">
          <p className="text-destructive text-sm whitespace-pre-wrap break-words">{executionResult.message}</p>
        </div>
      </div>
    );
  }

  // Show pending operation UI
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm max-w-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {getOperationIcon()}
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-semibold">{getOperationTitle()}</h3>
          <p className="text-muted-foreground text-sm">{operation.message}</p>
        </div>
      </div>

      {/* Operation Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Validator ID</span>
          <span className="font-semibold">{operation.validatorID}</span>
        </div>

        {operation.amount && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">
              {operation.amountFormatted || `${operation.amount} U2U`}
            </span>
          </div>
        )}

        {operation.wrID && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Withdrawal Request ID</span>
            <span className="font-semibold">{operation.wrID}</span>
          </div>
        )}

        {operation.lockupDurationDays && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lockup Duration</span>
            <span className="font-semibold">{operation.lockupDurationDays} days</span>
          </div>
        )}
      </div>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Please connect your wallet to proceed with this operation.</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {hasError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={!isConnected || isExecuting || isPending}
        className="w-full h-10 rounded-lg"
        variant="default"
      >
        {isExecuting || isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {getButtonText()}
          </>
        ) : (
          getButtonText()
        )}
      </Button>
    </div>
  );
}
