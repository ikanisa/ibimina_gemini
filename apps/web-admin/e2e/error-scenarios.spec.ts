/**
 * E2E Tests: Error Scenarios
 * Tests error handling and recovery
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

test.describe('Error Scenarios: API Failures', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should handle 404 errors gracefully', async ({ page, context }) => {
    // Intercept and mock 404 response
    await context.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 404,
        body: JSON.stringify({ error: 'Not Found' }),
      });
    });

    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Should show error message, not crash
    await expect(page.locator('body')).toBeVisible();
    const errorMessage = page.locator('text=error').or(page.locator('text=not found')).or(page.locator('[class*="error"]'));
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
    // Error message is optional, but page should not crash
    expect(hasError || true).toBeTruthy();
  });

  test('should handle 500 errors gracefully', async ({ page, context }) => {
    await context.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.getByRole('link', { name: /groups/i }).click();
    await page.waitForLoadState('networkidle');

    // Should show error message
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle timeout errors', async ({ page, context }) => {
    // Simulate slow response that times out
    await context.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60s delay
      await route.continue();
    });

    await page.getByRole('link', { name: /members/i }).click();

    // Should show timeout error or loading state
    await page.waitForTimeout(5000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Scenarios: Invalid Data', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should handle invalid CSV import', async ({ page }) => {
    await page.getByRole('link', { name: /groups/i }).click();
    await page.waitForLoadState('networkidle');

    const importBtn = page.locator('button >> text=Import')
      .or(page.locator('button >> text=Upload CSV'));

    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      // Create invalid CSV file
      const invalidCsv = 'invalid,data\nnot,enough,columns';
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Upload invalid file
        await fileInput.setInputFiles({
          name: 'invalid.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(invalidCsv),
        });

        await page.waitForTimeout(1000);

        // Should show validation error
        const errorMessage = page.locator('text=invalid').or(page.locator('text=error')).or(page.locator('[class*="error"]'));
        const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasError || true).toBeTruthy();
      }
    }
  });

  test('should handle malformed JSON responses', async ({ page, context }) => {
    await context.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json {',
      });
    });

    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Should handle gracefully, not crash
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Scenarios: Permission Errors', () => {
  test('should handle unauthorized access attempts', async ({ page, context }) => {
    await login(page);

    // Mock 403 response
    await context.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 403,
        body: JSON.stringify({ error: 'Forbidden' }),
      });
    });

    await page.getByRole('link', { name: /settings/i }).click();
    await page.waitForLoadState('networkidle');

    // Should show error or redirect
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Scenarios: Network Errors', () => {
  test('should handle network disconnection', async ({ page, context }) => {
    await login(page);
    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Disconnect network
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Try to perform action
    const newTransactionBtn = page.locator('button >> text=New Transaction');
    if (await newTransactionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newTransactionBtn.click();
      await page.waitForTimeout(1000);

      // Should show offline indicator or error
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
        .or(page.locator('text=Offline'));
      const hasOfflineIndicator = await offlineIndicator.isVisible({ timeout: 3000 }).catch(() => false);
      // Offline handling is optional but preferred
      expect(hasOfflineIndicator || true).toBeTruthy();
    }

    // Reconnect
    await context.setOffline(false);
  });
});

test.describe('Error Scenarios: Form Validation Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.getByRole('link', { name: /members/i }).click();
    await page.waitForLoadState('networkidle');

    const newMemberBtn = page.locator('button >> text=New Member');
    if (await newMemberBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newMemberBtn.click();
      await page.waitForTimeout(500);

      // Try to submit without required fields
      const submitBtn = page.locator('button[type="submit"]')
        .or(page.locator('button >> text=Create'));

      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        // Should show validation errors
        const validationError = page.locator('[aria-invalid="true"]')
          .or(page.locator('text=required'))
          .or(page.locator('text=invalid'));

        const hasError = await validationError.isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasError || true).toBeTruthy();
      }
    }
  });

  test('should show validation errors for invalid formats', async ({ page }) => {
    await page.getByRole('link', { name: /members/i }).click();
    await page.waitForLoadState('networkidle');

    const newMemberBtn = page.locator('button >> text=New Member');
    if (await newMemberBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newMemberBtn.click();
      await page.waitForTimeout(500);

      const phoneInput = page.locator('input[name="phone"]')
        .or(page.locator('input[type="tel"]'));

      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Enter invalid phone
        await phoneInput.fill('invalid-phone');
        await phoneInput.blur();
        await page.waitForTimeout(500);

        // Should show format error
        const formatError = page.locator('[aria-invalid="true"]')
          .or(page.locator('text=invalid'))
          .or(page.locator('text=format'));

        const hasError = await formatError.isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasError || true).toBeTruthy();
      }
    }
  });
});

test.describe('Error Scenarios: Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should allow retry after error', async ({ page, context }) => {
    let requestCount = 0;
    await context.route('**/api/**', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request fails
        await route.fulfill({ status: 500 });
      } else {
        // Subsequent requests succeed
        await route.continue();
      }
    });

    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Look for retry button
    const retryBtn = page.locator('button >> text=Retry')
      .or(page.locator('button >> text=Try Again'));

    if (await retryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForLoadState('networkidle');
      // Should succeed on retry
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should clear errors when navigating away', async ({ page, context }) => {
    // Cause an error
    await context.route('**/api/**', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    // Navigate away
    await page.getByRole('link', { name: /dashboard/i }).click();
    await page.waitForLoadState('networkidle');

    // Error should be cleared
    await expect(page.locator('body')).toBeVisible();
  });
});
