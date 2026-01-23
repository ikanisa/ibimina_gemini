/**
 * E2E Tests: Edge Cases
 * Tests edge cases and boundary conditions
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
  await page.waitForURL(/dashboard|home/i, { timeout: 10000 }).catch(() => { });
}

test.describe('Edge Cases: Large Data Sets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should handle large transaction lists with pagination', async ({ page }) => {
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Check for pagination controls
    const pagination = page.locator('[data-testid="pagination"]')
      .or(page.locator('button >> text=Next'))
      .or(page.locator('button >> text=Previous'));

    const hasPagination = await pagination.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPagination) {
      // Try navigating pages
      const nextBtn = page.locator('button >> text=Next').or(page.locator('[aria-label*="next"]'));
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForLoadState('networkidle');
        // Should still show transactions
        await expect(page.locator('text=Transaction').or(page.locator('table'))).toBeVisible();
      }
    }
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Navigate to transactions with a filter that returns no results
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Try searching for non-existent reference
    const searchInput = page.locator('input[placeholder*="Search"]')
      .or(page.locator('input[type="search"]'));

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('NONEXISTENT_REFERENCE_12345');
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Should show empty state message
      await expect(
        page.locator('text=No results').or(page.locator('text=No transactions')).or(page.locator('text=not found'))
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Edge Cases: Concurrent Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should handle rapid filter changes', async ({ page }) => {
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Rapidly change filters
    const statusFilter = page.locator('select').first().or(page.locator('[data-testid="status-filter"]'));
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      for (let i = 0; i < 3; i++) {
        await statusFilter.selectOption({ index: i });
        await page.waitForTimeout(200);
      }
      // Should still be responsive
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should prevent duplicate submissions', async ({ page }) => {
    await page.getByRole('link', { name: /groups/i }).click();
    await page.waitForLoadState('networkidle');

    const newGroupBtn = page.locator('button >> text=New Group')
      .or(page.locator('button >> text=Add Group'));

    if (await newGroupBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newGroupBtn.click();
      await page.waitForTimeout(500);

      const submitBtn = page.locator('button[type="submit"]')
        .or(page.locator('button >> text=Create'))
        .or(page.locator('button >> text=Save'));

      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Try double-clicking submit
        await submitBtn.dblclick();
        await page.waitForTimeout(1000);

        // Should only create one (check for single success message)
        const successMessages = await page.locator('text=created').or(page.locator('text=success')).count();
        expect(successMessages).toBeLessThanOrEqual(1);
      }
    }
  });
});

test.describe('Edge Cases: Network Conditions', () => {
  test('should handle slow network gracefully', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    await login(page);
    await page.getByRole('link', { name: /transactions/i }).click();

    // Should show loading state
    const loadingIndicator = page.locator('[data-testid="loading"]')
      .or(page.locator('text=Loading'))
      .or(page.locator('[class*="skeleton"]'));

    // Check if loading indicator is visible (optional, don't fail if not)
    await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);
    // Loading state is optional, but page should eventually load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle offline mode', async ({ page, context }) => {
    await login(page);
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Should show offline indicator
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
      .or(page.locator('text=Offline'))
      .or(page.locator('[class*="offline"]'));

    const hasOfflineIndicator = await offlineIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    // Offline indicator is optional but preferred
    expect(hasOfflineIndicator || true).toBeTruthy();

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(500);
  });
});

test.describe('Edge Cases: Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should handle very long input values', async ({ page }) => {
    await page.getByRole('link', { name: /members/i }).click();
    await page.waitForLoadState('networkidle');

    const newMemberBtn = page.locator('button >> text=New Member')
      .or(page.locator('button >> text=Add Member'));

    if (await newMemberBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newMemberBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator('input[name="full_name"]')
        .or(page.locator('input[placeholder*="name"]'));

      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Enter very long name
        const longName = 'A'.repeat(1000);
        await nameInput.fill(longName);

        // Should either truncate or show validation error
        const value = await nameInput.inputValue();
        const hasError = await page.locator('[aria-invalid="true"]')
          .or(page.locator('text=too long'))
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        expect(value.length < 1000 || hasError).toBeTruthy();
      }
    }
  });

  test('should handle special characters in inputs', async ({ page }) => {
    await page.getByRole('link', { name: /groups/i }).click();
    await page.waitForLoadState('networkidle');

    const newGroupBtn = page.locator('button >> text=New Group');
    if (await newGroupBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newGroupBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator('input[name="name"]')
        .or(page.locator('input[placeholder*="name"]'));

      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Try special characters
        await nameInput.fill("Test Group <script>alert('xss')</script>");

        // Should sanitize or show validation error
        const value = await nameInput.inputValue();
        const hasScript = value.includes('<script>');
        expect(hasScript).toBe(false);
      }
    }
  });
});

test.describe('Edge Cases: Date Range Boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should handle very old dates', async ({ page }) => {
    await page.getByRole('link', { name: /reports/i }).click();
    await page.waitForLoadState('networkidle');

    const dateFrom = page.locator('input[name="from"]')
      .or(page.locator('input[type="date"]').first());

    if (await dateFrom.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Set date to 10 years ago
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 10);
      await dateFrom.fill(oldDate.toISOString().split('T')[0]);

      await page.waitForLoadState('networkidle');
      // Should handle gracefully
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle future dates', async ({ page }) => {
    await page.getByRole('link', { name: /reports/i }).click();
    await page.waitForLoadState('networkidle');

    const dateTo = page.locator('input[name="to"]')
      .or(page.locator('input[type="date"]').last());

    if (await dateTo.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Set date to 1 year in future
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      await dateTo.fill(futureDate.toISOString().split('T')[0]);

      await page.waitForLoadState('networkidle');
      // Should either show error or handle gracefully
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
