export default async function globalSetup(): Promise<void> {
  // Global setup for DeFi testing environment
  console.log('🚀 Setting up DeFi test environment...');
  
  // Set test environment variables
  (process.env as any)['NODE_ENV'] = 'test'
  process.env['NEXT_PUBLIC_CHAIN_ID'] = '1'
  process.env['NEXT_PUBLIC_RPC_URL'] = 'https://eth-mainnet.alchemyapi.io/v2/test'
  
  // Initialize any global test state
  ;(global as any).__TEST_START_TIME__ = Date.now()
  
  console.log('✅ DeFi test environment ready');
}