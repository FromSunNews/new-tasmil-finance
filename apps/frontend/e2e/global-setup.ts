import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment for DeFi workflows...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the application to be ready
    await page.goto(config.projects[0]?.use?.baseURL || 'http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Setup any global state needed for DeFi E2E tests
    // For example, mock wallet connections, set up test data, etc.
    
    console.log('✅ E2E test environment ready for DeFi workflows')
  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup