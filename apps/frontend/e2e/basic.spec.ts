import { test, expect } from '@playwright/test'

test.describe('Basic Application Tests', () => {
  test('should load the homepage', async ({ page }) => {
    // This test will fail if the dev server isn't running, but that's expected
    // It's just to verify the Playwright configuration is working
    await page.goto('/')
    
    // Basic check that the page loads
    await expect(page).toHaveTitle(/Tasmil Finance|DeFi|Finance/)
  })
})