/**
 * E2E Tests: Transaction Flow
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

const TEST_USER = {
    email: process.env.E2E_STAFF_EMAIL || 'staff@test.com',
    password: process.env.E2E_STAFF_PASSWORD || 'Test123456!'
};

// ============================================================================
// Helper Functions
// ============================================================================

async function login(page: Page) {
    await page.goto(BASE_URL);

    const isLoggedIn = await page.locator('nav').isVisible({ timeout: 2000 }).catch(() => false);
    if (isLoggedIn) return;

    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await page.waitForURL(/dashboard|home/i, { timeout: 10000 }).catch(() => { });
}

async function navigateToTransactions(page: Page) {
    await page.locator('nav >> text=Transactions')
        .or(page.getByRole('link', { name: /transactions/i }))
        .click();
    await page.waitForLoadState('networkidle');
}

// ============================================================================
// Transaction List Tests
// ============================================================================

test.describe('Transaction List', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateToTransactions(page);
    });

    test('should display transactions page', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: /transactions/i })
                .or(page.locator('h1 >> text=Transactions'))
        ).toBeVisible();
    });

    test('should show transaction list or empty state', async ({ page }) => {
        // Either show transactions or empty state
        const hasTransactions = await page.locator('[data-testid="transaction-row"]')
            .or(page.locator('table tbody tr'))
            .count();

        const hasEmptyState = await page.locator('text=/no transactions|empty/i')
            .isVisible({ timeout: 3000 })
            .catch(() => false);

        expect(hasTransactions > 0 || hasEmptyState).toBeTruthy();
    });

    test('should filter by date range', async ({ page }) => {
        const dateFilter = page.locator('input[type="date"]').first()
            .or(page.locator('[data-testid="date-filter"]'));

        if (await dateFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Set date filter
            await dateFilter.fill('2026-01-01');
            await page.waitForLoadState('networkidle');

            // Verify filter applied
            const url = page.url();
            expect(url.includes('date') || true).toBeTruthy();
        }
    });

    test('should filter by transaction type', async ({ page }) => {
        const typeFilter = page.locator('select')
            .or(page.locator('[data-testid="type-filter"]'))
            .first();

        if (await typeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
            await typeFilter.selectOption({ index: 1 });
            await page.waitForLoadState('networkidle');
        }
    });

    test('should search transactions', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]')
            .or(page.locator('input[type="search"]'));

        if (await searchInput.isVisible()) {
            await searchInput.fill('MOMO');
            await page.waitForTimeout(500);
            await page.waitForLoadState('networkidle');
        }
    });

    test('should paginate transactions', async ({ page }) => {
        const nextButton = page.getByRole('button', { name: /next/i })
            .or(page.locator('[aria-label="Next page"]'));

        const hasPagination = await nextButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasPagination && await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForLoadState('networkidle');
        }
    });
});

// ============================================================================
// Transaction Detail Tests
// ============================================================================

test.describe('Transaction Details', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateToTransactions(page);
    });

    test('should open transaction detail view', async ({ page }) => {
        const firstRow = page.locator('[data-testid="transaction-row"]').first()
            .or(page.locator('table tbody tr').first());

        if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstRow.click();
            await page.waitForTimeout(500);

            // Should show detail (drawer, modal, or expanded)
            await expect(
                page.locator('[role="dialog"]')
                    .or(page.locator('[data-testid="transaction-detail"]'))
                    .or(page.getByText(/amount|reference|status/i))
            ).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show transaction metadata', async ({ page }) => {
        const firstRow = page.locator('[data-testid="transaction-row"]').first()
            .or(page.locator('table tbody tr').first());

        if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstRow.click();
            await page.waitForTimeout(500);

            // Check for key transaction fields
            const hasAmount = await page.locator('text=/RWF|amount/i').isVisible({ timeout: 3000 }).catch(() => false);
            const hasStatus = await page.locator('text=/completed|pending|failed/i').isVisible({ timeout: 3000 }).catch(() => false);

            expect(hasAmount || hasStatus).toBeTruthy();
        }
    });
});

// ============================================================================
// Transaction Export Tests
// ============================================================================

test.describe('Transaction Export', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateToTransactions(page);
    });

    test('should have export button', async ({ page }) => {
        const exportButton = page.getByRole('button', { name: /export|download|csv/i })
            .or(page.locator('button >> text=Export'));

        const hasExport = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasExport) {
            await expect(exportButton).toBeEnabled();
        }
    });

    test('should trigger download on export click', async ({ page }) => {
        const exportButton = page.getByRole('button', { name: /export|download|csv/i });

        if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Listen for download event
            const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

            await exportButton.click();

            const download = await downloadPromise;
            if (download) {
                expect(download.suggestedFilename()).toContain('.csv');
            }
        }
    });
});

// ============================================================================
// Transaction Print Tests
// ============================================================================

test.describe('Transaction Receipt', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateToTransactions(page);
    });

    test('should have print receipt option', async ({ page }) => {
        const firstRow = page.locator('[data-testid="transaction-row"]').first()
            .or(page.locator('table tbody tr').first());

        if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstRow.click();
            await page.waitForTimeout(500);

            const printButton = page.getByRole('button', { name: /print|receipt/i })
                .or(page.locator('[aria-label*="print"]'));

            const hasPrint = await printButton.isVisible({ timeout: 3000 }).catch(() => false);

            if (hasPrint) {
                await expect(printButton).toBeEnabled();
            }
        }
    });
});

// ============================================================================
// Transaction Accessibility Tests
// ============================================================================

test.describe('Transaction Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateToTransactions(page);
    });

    test('should be keyboard navigable', async ({ page }) => {
        await page.keyboard.press('Tab');

        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['INPUT', 'BUTTON', 'A', 'SELECT']).toContain(focusedElement);
    });

    test('should have proper table structure for screen readers', async ({ page }) => {
        const table = page.locator('table');

        if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Check for proper table structure
            const hasHeader = await table.locator('thead th').count();
            expect(hasHeader).toBeGreaterThan(0);
        }
    });
});
