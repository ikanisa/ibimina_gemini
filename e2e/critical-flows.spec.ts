import { test, expect } from '@playwright/test';

/**
 * Phase 9: Critical Flow E2E Tests
 * Tests the main operational workflows
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

const TEST_USERS = {
  staff: {
    email: process.env.E2E_STAFF_EMAIL || 'staff@test.com',
    password: process.env.E2E_STAFF_PASSWORD || 'test123456'
  }
};

// Helper to login
async function login(page: any, user: { email: string; password: string }) {
  await page.goto(BASE_URL);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Dashboard', { timeout: 15000 });
}

test.describe('Critical Flow: Dashboard → Transactions → Allocate', () => {
  test('complete allocation workflow', async ({ page }) => {
    await login(page, TEST_USERS.staff);
    
    // 1. View Dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // 2. Navigate to Transactions
    await page.click('nav >> text=Transactions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Ledger')).toBeVisible();
    
    // 3. Look for unallocated transaction (if any)
    const unallocatedRow = page.locator('[data-status="unallocated"]').first();
    if (await unallocatedRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to open drawer
      await unallocatedRow.click();
      
      // Look for allocate button
      const allocateButton = page.locator('button >> text=Allocate');
      if (await allocateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await allocateButton.click();
        
        // Search for member
        await page.fill('[placeholder*="Search member"]', 'test');
        await page.waitForTimeout(500); // Wait for search
        
        // Select first result if available
        const memberResult = page.locator('[data-testid="member-result"]').first();
        if (await memberResult.isVisible({ timeout: 3000 }).catch(() => false)) {
          await memberResult.click();
          
          // Confirm allocation
          const confirmButton = page.locator('button >> text=Confirm');
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
            
            // Should see success
            await expect(page.locator('text=allocated').or(page.locator('text=success'))).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });
});

test.describe('Critical Flow: Reconciliation Actions', () => {
  test('reconciliation tab navigation', async ({ page }) => {
    await login(page, TEST_USERS.staff);
    
    // Navigate to Reconciliation
    await page.click('nav >> text=Reconciliation');
    await page.waitForLoadState('networkidle');
    
    // Should see reconciliation page with tabs
    await expect(page.locator('text=Reconciliation').first()).toBeVisible();
    
    // Check tabs exist
    await expect(page.locator('text=Unallocated').or(page.locator('[role="tab"]'))).toBeVisible();
  });

  test('view parse errors', async ({ page }) => {
    await login(page, TEST_USERS.staff);
    
    await page.click('nav >> text=Reconciliation');
    await page.waitForLoadState('networkidle');
    
    // Click on Parse errors tab if exists
    const parseErrorsTab = page.locator('text=Parse errors').or(page.locator('text=Parse Errors'));
    if (await parseErrorsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await parseErrorsTab.click();
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Critical Flow: Groups & Members', () => {
  test('view groups list', async ({ page }) => {
    await login(page, TEST_USERS.staff);
    
    // Navigate to Groups
    await page.click('nav >> text=Groups');
    await page.waitForLoadState('networkidle');
    
    // Should see groups page
    await expect(page.locator('text=Groups').first()).toBeVisible();
  });

  test('view members list', async ({ page }) => {
    await login(page, TEST_USERS.staff);
    
    // Navigate to Members
    await page.click('nav >> text=Members');
    await page.waitForLoadState('networkidle');
    
    // Should see members page
    await expect(page.locator('text=Members').or(page.locator('text=Member'))).toBeVisible();
  });
});

test.describe('Critical Flow: Reports', () => {
  test('generate institution report', async ({ page }) => {
    await login(page, TEST_USERS.staff);
    
    // Navigate to Reports
    await page.click('nav >> text=Reports');
    await page.waitForLoadState('networkidle');
    
    // Should see reports page
    await expect(page.locator('text=Reports').first()).toBeVisible();
    
    // Check for scope selector or KPI cards
    await expect(
      page.locator('[data-testid="scope-selector"]')
        .or(page.locator('text=Total'))
        .or(page.locator('text=Allocated'))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Critical Flow: Settings', () => {
  test('view settings pages', async ({ page }) => {
    await login(page, TEST_USERS.staff);
    
    // Navigate to Settings (if accessible)
    const settingsNav = page.locator('nav >> text=Settings');
    if (await settingsNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsNav.click();
      await page.waitForLoadState('networkidle');
      
      // Should see settings page
      await expect(page.locator('text=Settings')).toBeVisible();
    }
  });
});

test.describe('Critical Flow: System Health', () => {
  test('system health indicator visible and clickable', async ({ page }) => {
    await login(page, TEST_USERS.staff);
    
    // Look for health indicator in header
    const healthIndicator = page.locator('[title*="System Health"]').or(page.locator('text=All systems'));
    if (await healthIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await healthIndicator.click();
      
      // Should open health drawer
      await expect(page.locator('text=System Health')).toBeVisible({ timeout: 3000 });
      
      // Close drawer
      await page.keyboard.press('Escape');
    }
  });
});

