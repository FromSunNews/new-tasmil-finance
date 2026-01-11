"use client";

// ⚡ Yield CopilotKit action

import { useCopilotAction } from '@copilotkit/react-core';
import { toast } from 'sonner';

export function useYieldAction() {
  useCopilotAction({
    name: 'search_yields',
    description: 'Search for yield farming opportunities',
    parameters: [
      {
        name: 'token',
        type: 'string',
        description: 'Token to find yields for (e.g., USDC, ETH)',
        required: false,
      },
      {
        name: 'chain',
        type: 'string',
        description: 'Blockchain to search on',
        required: false,
      },
      {
        name: 'minApy',
        type: 'number',
        description: 'Minimum APY percentage',
        required: false,
      },
      {
        name: 'protocol',
        type: 'string',
        description: 'Specific protocol (e.g., Aave, Compound)',
        required: false,
      },
    ],
    handler: async ({ token, chain, minApy }) => {
      toast.info('Searching for yield opportunities...');
      
      // TODO: Implement actual yield search
      const mockYields = [
        { protocol: 'Aave', token: token || 'USDC', apy: 5.2, tvl: '1.2B', chain: chain || 'Ethereum' },
        { protocol: 'Compound', token: token || 'USDC', apy: 4.8, tvl: '800M', chain: chain || 'Ethereum' },
        { protocol: 'Curve', token: token || 'USDC', apy: 8.5, tvl: '500M', chain: chain || 'Ethereum' },
      ].filter(y => !minApy || y.apy >= minApy);
      
      return {
        success: true,
        yields: mockYields,
        count: mockYields.length,
      };
    },
    render: ({ result, args, status }) => {
      if (status === 'executing') {
        return (
          <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
              <span>Searching yields{args.token ? ` for ${args.token}` : ''}...</span>
            </div>
          </div>
        );
      }

      if (status === 'complete' && result) {
        const data = result as { 
          success: boolean; 
          yields: Array<{ protocol: string; token: string; apy: number; tvl: string; chain: string }>;
          count: number;
        };
        
        if (!data.success || data.count === 0) {
          return (
            <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
              <p>No yield opportunities found matching your criteria.</p>
            </div>
          );
        }

        return (
          <div className="p-4 border rounded-lg bg-green-50 border-green-200">
            <p className="font-medium mb-2">Found {data.count} yield opportunities:</p>
            <div className="space-y-2">
              {data.yields.map((y, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{y.protocol} - {y.token}</span>
                  <span className="font-medium text-green-600">{y.apy}% APY</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      return <></>;
    },
  });
}
