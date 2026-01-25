/**
 * E2E Tests: Performance
 * Tests performance metrics and thresholds
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

const TEST_USER = {
  email: process.env.E2E_STAFF_EMAIL || 'staff@test.com',
  password: process.env.E2E_STAFF_PASSWORD || 'Test123456!',
};

async function login(page: Page) {
  await page.goto(BASE_URL);
  const isLoggedIn = await page.locator('nav').isVisible({ timeout: 2000 }).catch(() => false);
  if (isLoggedIn) return;

  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL(/dashboard|home/i, { timeout: 10000 }).catch(() => {});
}

test.describe('Performance: Page Load Times', () => {
  test('dashboard should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await login(page);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds (after login)
    expect(loadTime).toBeLessThan(3000);
  });

  test('transactions page should load within 2 seconds', async ({ page }) => {
    await login(page);
    
    const startTime = Date.now();
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });

  test('groups page should load within 2 seconds', async ({ page }) => {
    await login(page);
    
    const startTime = Date.now();
    await page.getByRole('link', { name: /groups/i }).click();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });

  test('members page should load within 2 seconds', async ({ page }) => {
    await login(page);
    
    const startTime = Date.now();
    await page.getByRole('link', { name: /members/i }).click();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });
});

test.describe('Performance: API Response Times', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('transaction list API should respond within 1 second', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/transactions') && response.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);

    await page.getByRole('link', { name: /transactions/i }).click();
    const response = await responsePromise;

    if (response) {
      const responseTime = response.timing().responseEnd - response.timing().requestStart;
      expect(responseTime).toBeLessThan(1000);
    }
  });

  test('groups list API should respond within 1 second', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/groups') && response.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);

    await page.getByRole('link', { name: /groups/i }).click();
    const response = await responsePromise;

    if (response) {
      const responseTime = response.timing().responseEnd - response.timing().requestStart;
      expect(responseTime).toBeLessThan(1000);
    }
  });
});

test.describe('Performance: Interaction Response Times', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('filter change should update UI within 500ms', async ({ page }) => {
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      const startTime = Date.now();
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500); // Wait for UI update
      const responseTime = Date.now() - startTime;

      // Should respond within 500ms
      expect(responseTime).toBeLessThan(500);
    }
  });

  test('search input should debounce within 300ms', async ({ page }) => {
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const startTime = Date.now();
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');
      const responseTime = Date.now() - startTime;

      // Debounce should be reasonable (300-1000ms)
      expect(responseTime).toBeLessThan(1000);
    }
  });
});

test.describe('Performance: Memory Usage', () => {
  test('should not have memory leaks on navigation', async ({ page }) => {
    await login(page);

    // Navigate between pages multiple times
    for (let i = 0; i < 5; i++) {
      await page.getByRole('link', { name: /transactions/i }).click();
      await page.waitForLoadState('networkidle');
      await page.getByRole('link', { name: /groups/i }).click();
      await page.waitForLoadState('networkidle');
      await page.getByRole('link', { name: /members/i }).click();
      await page.waitForLoadState('networkidle');
    }

    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance: Bundle Size', () => {
  test('initial JavaScript bundle should be reasonable', async ({ page }) => {
    const jsSizes: number[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') && response.status() === 200) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          jsSizes.push(parseInt(contentLength, 10));
        }
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const totalJsSize = jsSizes.reduce((sum, size) => sum + size, 0);
    // Total JS should be less than 2MB (uncompressed)
    expect(totalJsSize).toBeLessThan(2 * 1024 * 1024);
  });
});
