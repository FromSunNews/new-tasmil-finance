"use client";

// ⚡ Portfolio CopilotKit action

import { useCopilotAction } from '@copilotkit/react-core';
import { toast } from 'sonner';

export function usePortfolioAction() {
  useCopilotAction({
    name: 'get_portfolio',
    description: 'Get user portfolio information and balances',
    parameters: [
      {
        name: 'address',
        type: 'string',
        description: 'Wallet address to check (optional, uses connected wallet)',
        required: false,
      },
      {
        name: 'chain',
        type: 'string',
        description: 'Specific chain to check',
        required: false,
      },
    ],
    handler: async () => {
      toast.info('Fetching portfolio...');
      
      // TODO: Implement actual portfolio fetch
      const mockPortfolio = {
        totalValue: 12500.50,
        tokens: [
          { symbol: 'ETH', balance: 2.5, value: 5000, chain: 'Ethereum' },
          { symbol: 'USDC', balance: 5000, value: 5000, chain: 'Ethereum' },
          { symbol: 'U2U', balance: 10000, value: 2500, chain: 'U2U' },
        ],
        change24h: 3.5,
      };
      
      return {
        success: true,
        portfolio: mockPortfolio,
      };
    },
    render: ({ result, status }) => {
      if (status === 'executing') {
        return (
          <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
              <span>Loading portfolio...</span>
            </div>
          </div>
        );
      }

      if (status === 'complete' && result) {
        const data = result as { 
          success: boolean; 
          portfolio: {
            totalValue: number;
            tokens: Array<{ symbol: string; balance: number; value: number; chain: string }>;
            change24h: number;
          };
        };
        
        if (!data.success) {
          return (
            <div className="p-4 border rounded-lg bg-red-50 border-red-200">
              <p>Failed to load portfolio.</p>
            </div>
          );
        }

        const { portfolio } = data;
        const changeColor = portfolio.change24h >= 0 ? 'text-green-600' : 'text-red-600';

        return (
          <div className="p-4 border rounded-lg bg-white border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold">
                ${portfolio.totalValue.toLocaleString()}
              </span>
              <span className={`text-sm ${changeColor}`}>
                {portfolio.change24h >= 0 ? '+' : ''}{portfolio.change24h}% (24h)
              </span>
            </div>
            <div className="space-y-2">
              {portfolio.tokens.map((token, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{token.symbol} ({token.chain})</span>
                  <span>{token.balance.toLocaleString()} (${token.value.toLocaleString()})</span>
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
