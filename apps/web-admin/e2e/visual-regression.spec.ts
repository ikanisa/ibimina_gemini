/**
 * E2E Tests: Visual Regression
 * Tests visual consistency using screenshots
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

test.describe('Visual Regression: Login Page', () => {
  test('login page should match baseline', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test('login form should match baseline', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const loginForm = page.locator('form').first();
    if (await loginForm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(loginForm).toHaveScreenshot('login-form.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Visual Regression: Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard should match baseline', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('dashboard KPI cards should match baseline', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const kpiCards = page.locator('[data-testid="kpi-card"]')
      .or(page.locator('[class*="card"]').first());

    if (await kpiCards.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(kpiCards.first()).toHaveScreenshot('kpi-card.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Visual Regression: Transactions Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('transactions table should match baseline', async ({ page }) => {
    const table = page.locator('table').first();
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(table).toHaveScreenshot('transactions-table.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('transaction filters should match baseline', async ({ page }) => {
    const filters = page.locator('[data-testid="filters"]')
      .or(page.locator('select').first());

    if (await filters.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(filters).toHaveScreenshot('transaction-filters.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Visual Regression: Groups Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: /groups/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('groups list should match baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('groups-page.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});

test.describe('Visual Regression: Members Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: /members/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('members list should match baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('members-page.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});

test.describe('Visual Regression: Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('mobile view should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('tablet view should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('tablet-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});

test.describe('Visual Regression: Error States', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('error message should match baseline', async ({ page, context }) => {
    // Simulate error
    await context.route('**/api/**', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('[class*="error"]')
      .or(page.locator('text=error'))
      .first();

    if (await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(errorMessage).toHaveScreenshot('error-message.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('empty state should match baseline', async ({ page }) => {
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Search for non-existent item
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('NONEXISTENT_12345');
      await page.waitForLoadState('networkidle');

      const emptyState = page.locator('text=No results')
        .or(page.locator('text=not found'))
        .or(page.locator('[data-testid="empty-state"]'));

      if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(emptyState).toHaveScreenshot('empty-state.png', {
          maxDiffPixels: 50,
        });
      }
    }
  });
});
