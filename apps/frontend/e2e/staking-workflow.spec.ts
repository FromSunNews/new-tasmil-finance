import { test, expect } from './fixtures/defi-fixtures'

test.describe('Staking Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should complete full staking process', async ({ 
    page, 
    mockWallet, 
    stakingPage 
  }) => {
    // Connect wallet
    await mockWallet.connect()
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible()

    // Navigate to staking page
    await stakingPage.navigateToStaking()
    await expect(page.locator('h1')).toContainText('Staking')

    // Select a validator
    await stakingPage.selectValidator('1')
    await expect(page.locator('[data-testid="selected-validator"]')).toBeVisible()

    // Enter stake amount
    await stakingPage.enterStakeAmount('100')
    await expect(page.locator('[data-testid="stake-amount"]')).toHaveValue('100')

    // Confirm staking transaction
    await stakingPage.confirmStaking()
    await expect(page.locator('[data-testid="transaction-success"]')).toBeVisible()
  })

  test('should display validator information correctly', async ({ 
    page, 
    mockWallet, 
    stakingPage 
  }) => {
    await mockWallet.connect()
    await stakingPage.navigateToStaking()

    // Check validator list is displayed
    await expect(page.locator('[data-testid="validator-list"]')).toBeVisible()
    
    // Check validator cards contain required information
    const validatorCard = page.locator('[data-testid="validator-1"]').first()
    await expect(validatorCard.locator('[data-testid="validator-name"]')).toBeVisible()
    await expect(validatorCard.locator('[data-testid="validator-commission"]')).toBeVisible()
    await expect(validatorCard.locator('[data-testid="validator-voting-power"]')).toBeVisible()
  })

  test('should handle staking errors gracefully', async ({ 
    page, 
    mockWallet, 
    stakingPage 
  }) => {
    await mockWallet.connect()
    await stakingPage.navigateToStaking()

    // Mock a transaction failure
    await page.route('**/api/stake', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Insufficient balance' })
      })
    })

    await stakingPage.selectValidator('1')
    await stakingPage.enterStakeAmount('1000000') // Large amount to trigger error
    
    await page.click('[data-testid="confirm-stake"]')
    
    // Should display error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Insufficient balance')
  })
})