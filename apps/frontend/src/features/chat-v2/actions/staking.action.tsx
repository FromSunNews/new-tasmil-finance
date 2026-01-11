"use client";

// ⚡ Staking CopilotKit action

import { useCopilotAction } from '@copilotkit/react-core';
import { toast } from 'sonner';

export function useStakingAction() {
  useCopilotAction({
    name: 'stake_tokens',
    description: 'Stake tokens to earn rewards',
    parameters: [
      {
        name: 'amount',
        type: 'number',
        description: 'Amount of tokens to stake',
        required: true,
      },
      {
        name: 'token',
        type: 'string',
        description: 'Token symbol to stake (e.g., U2U, ETH)',
        required: true,
      },
      {
        name: 'validatorId',
        type: 'string',
        description: 'Validator ID to stake with',
        required: false,
      },
      {
        name: 'duration',
        type: 'string',
        description: 'Staking duration (e.g., 30 days, 90 days, 1 year)',
        required: false,
      },
    ],
    handler: async ({ amount, token }) => {
      toast.info(`Staking ${amount} ${token}...`);
      
      // TODO: Implement actual staking logic
      return {
        success: true,
        message: `Successfully initiated staking of ${amount} ${token}`,
        transactionId: `stake_${Date.now()}`,
        estimatedRewards: amount * 0.05,
      };
    },
    render: ({ result, args, status }) => {
      if (status === 'executing') {
        return (
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span>Staking {args.amount} {args.token}...</span>
            </div>
          </div>
        );
      }

      if (status === 'complete' && result) {
        const data = result as { success: boolean; message: string; estimatedRewards?: number };
        return (
          <div className={`p-4 border rounded-lg ${data.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="font-medium">{data.message}</p>
            {data.estimatedRewards && (
              <p className="text-sm text-gray-600 mt-1">
                Estimated rewards: {data.estimatedRewards} {args.token}/year
              </p>
            )}
          </div>
        );
      }

      return <></>;
    },
  });
}
