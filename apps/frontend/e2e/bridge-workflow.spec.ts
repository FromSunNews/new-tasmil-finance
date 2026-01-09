import { test, expect } from './fixtures/defi-fixtures'

test.describe('Bridge Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should complete cross-chain bridge transaction', async ({ 
    page, 
    mockWallet, 
    bridgePage 
  }) => {
    // Connect wallet
    await mockWallet.connect()
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible()

    // Navigate to bridge page
    await bridgePage.navigateToBridge()
    await expect(page.locator('h1')).toContainText('Bridge')

    // Select source and destination chains
    await bridgePage.selectSourceChain('ethereum')
    await bridgePage.selectDestinationChain('polygon')

    // Enter bridge amount
    await bridgePage.enterBridgeAmount('50')
    await expect(page.locator('[data-testid="bridge-amount"]')).toHaveValue('50')

    // Review bridge details
    await expect(page.locator('[data-testid="bridge-fee"]')).toBeVisible()
    await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible()

    // Confirm bridge transaction
    await bridgePage.confirmBridge()
    await expect(page.locator('[data-testid="bridge-success"]')).toBeVisible()
  })

  test('should display bridge routes and fees', async ({ 
    page, 
    mockWallet, 
    bridgePage 
  }) => {
    await mockWallet.connect()
    await bridgePage.navigateToBridge()

    // Check available routes are displayed
    await expect(page.locator('[data-testid="bridge-routes"]')).toBeVisible()
    
    // Select a route and verify fee calculation
    await bridgePage.selectSourceChain('ethereum')
    await bridgePage.selectDestinationChain('polygon')
    await bridgePage.enterBridgeAmount('100')

    await expect(page.locator('[data-testid="bridge-fee"]')).toContainText('%')
    await expect(page.locator('[data-testid="estimated-time"]')).toContainText('minutes')
  })

  test('should validate bridge amount limits', async ({ 
    page, 
    mockWallet, 
    bridgePage 
  }) => {
    await mockWallet.connect()
    await bridgePage.navigateToBridge()

    await bridgePage.selectSourceChain('ethereum')
    await bridgePage.selectDestinationChain('polygon')

    // Test minimum amount validation
    await bridgePage.enterBridgeAmount('0.001')
    await expect(page.locator('[data-testid="amount-error"]')).toContainText('Minimum amount')

    // Test maximum amount validation
    await bridgePage.enterBridgeAmount('1000000')
    await expect(page.locator('[data-testid="amount-error"]')).toContainText('Exceeds balance')
  })
})