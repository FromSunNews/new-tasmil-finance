"use client";

// ⚡ Bridge CopilotKit action

import { useCopilotAction } from '@copilotkit/react-core';
import { toast } from 'sonner';

export function useBridgeAction() {
  useCopilotAction({
    name: 'bridge_tokens',
    description: 'Bridge tokens between different blockchain networks',
    parameters: [
      {
        name: 'amount',
        type: 'number',
        description: 'Amount of tokens to bridge',
        required: true,
      },
      {
        name: 'token',
        type: 'string',
        description: 'Token symbol to bridge (e.g., USDT, USDC, ETH)',
        required: true,
      },
      {
        name: 'fromChain',
        type: 'string',
        description: 'Source blockchain (e.g., Ethereum, BSC, U2U)',
        required: true,
      },
      {
        name: 'toChain',
        type: 'string',
        description: 'Destination blockchain',
        required: true,
      },
    ],
    handler: async ({ amount, token, fromChain, toChain }) => {
      toast.info(`Bridging ${amount} ${token} from ${fromChain} to ${toChain}...`);
      
      // TODO: Implement actual bridge logic
      const estimatedFee = amount * 0.001; // 0.1% fee
      const estimatedTime = '5-15 minutes';
      
      return {
        success: true,
        message: `Bridge initiated: ${amount} ${token} from ${fromChain} to ${toChain}`,
        transactionId: `bridge_${Date.now()}`,
        estimatedFee,
        estimatedTime,
      };
    },
    render: ({ result, args, status }) => {
      if (status === 'executing') {
        return (
          <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
              <span>Bridging {args.amount} {args.token}...</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {args.fromChain} → {args.toChain}
            </p>
          </div>
        );
      }

      if (status === 'complete' && result) {
        const data = result as { 
          success: boolean; 
          message: string; 
          estimatedFee?: number;
          estimatedTime?: string;
        };
        return (
          <div className={`p-4 border rounded-lg ${data.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="font-medium">{data.message}</p>
            {data.estimatedFee && (
              <p className="text-sm text-gray-600 mt-1">
                Fee: ~{data.estimatedFee} {args.token}
              </p>
            )}
            {data.estimatedTime && (
              <p className="text-sm text-gray-600">
                Estimated time: {data.estimatedTime}
              </p>
            )}
          </div>
        );
      }

      return <></>;
    },
  });
}
