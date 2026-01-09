import { test as base, expect } from '@playwright/test'

// Define custom fixtures for DeFi E2E testing
export interface DeFiFixtures {
  mockWallet: {
    connect: () => Promise<void>
    disconnect: () => Promise<void>
    getAddress: () => string
  }
  stakingPage: {
    navigateToStaking: () => Promise<void>
    selectValidator: (validatorId: string) => Promise<void>
    enterStakeAmount: (amount: string) => Promise<void>
    confirmStaking: () => Promise<void>
  }
  bridgePage: {
    navigateToBridge: () => Promise<void>
    selectSourceChain: (chain: string) => Promise<void>
    selectDestinationChain: (chain: string) => Promise<void>
    enterBridgeAmount: (amount: string) => Promise<void>
    confirmBridge: () => Promise<void>
  }
}

export const test = base.extend<DeFiFixtures>({
  mockWallet: async ({ page }, use) => {
    const mockWallet = {
      connect: async () => {
        // Mock wallet connection
        await page.evaluate(() => {
          window.ethereum = {
            request: async ({ method }: { method: string }) => {
              if (method === 'eth_requestAccounts') {
                return ['0x1234567890123456789012345678901234567890']
              }
              if (method === 'eth_chainId') {
                return '0x1'
              }
              return null
            },
            on: () => {},
            removeListener: () => {},
          }
        })
        await page.click('[data-testid="connect-wallet"]')
      },
      
      disconnect: async () => {
        await page.click('[data-testid="disconnect-wallet"]')
      },
      
      getAddress: () => '0x1234567890123456789012345678901234567890',
    }
    
    await use(mockWallet)
  },

  stakingPage: async ({ page }, use) => {
    const stakingPage = {
      navigateToStaking: async () => {
        await page.goto('/staking')
        await page.waitForLoadState('networkidle')
      },
      
      selectValidator: async (validatorId: string) => {
        await page.click(`[data-testid="validator-${validatorId}"]`)
      },
      
      enterStakeAmount: async (amount: string) => {
        await page.fill('[data-testid="stake-amount"]', amount)
      },
      
      confirmStaking: async () => {
        await page.click('[data-testid="confirm-stake"]')
        await page.waitForSelector('[data-testid="transaction-success"]', { timeout: 30000 })
      },
    }
    
    await use(stakingPage)
  },

  bridgePage: async ({ page }, use) => {
    const bridgePage = {
      navigateToBridge: async () => {
        await page.goto('/bridge')
        await page.waitForLoadState('networkidle')
      },
      
      selectSourceChain: async (chain: string) => {
        await page.click('[data-testid="source-chain-selector"]')
        await page.click(`[data-testid="chain-${chain}"]`)
      },
      
      selectDestinationChain: async (chain: string) => {
        await page.click('[data-testid="destination-chain-selector"]')
        await page.click(`[data-testid="chain-${chain}"]`)
      },
      
      enterBridgeAmount: async (amount: string) => {
        await page.fill('[data-testid="bridge-amount"]', amount)
      },
      
      confirmBridge: async () => {
        await page.click('[data-testid="confirm-bridge"]')
        await page.waitForSelector('[data-testid="bridge-success"]', { timeout: 60000 })
      },
    }
    
    await use(bridgePage)
  },
})

export { expect }