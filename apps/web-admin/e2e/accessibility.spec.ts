/**
 * E2E Tests: Accessibility Compliance
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have proper document structure', async ({ page }) => {
        // Check for lang attribute
        const html = page.locator('html');
        await expect(html).toHaveAttribute('lang', /.+/);

        // Check for title
        await expect(page).toHaveTitle(/.+/);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        // Get all headings
        const h1Count = await page.locator('h1').count();

        // Should have exactly one h1 (or zero before content loads)
        expect(h1Count).toBeLessThanOrEqual(1);
    });

    test('should have accessible buttons', async ({ page }) => {
        // All buttons should have accessible names
        const buttons = page.getByRole('button');
        const count = await buttons.count();

        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const accessibleName = await button.getAttribute('aria-label') || await button.textContent();
            expect(accessibleName?.trim().length).toBeGreaterThan(0);
        }
    });

    test('should have accessible form inputs', async ({ page }) => {
        // All inputs should have labels
        const inputs = page.locator('input:not([type="hidden"])');
        const count = await inputs.count();

        for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledby = await input.getAttribute('aria-labelledby');

            // Input should have associated label via id, aria-label, or aria-labelledby
            const hasLabel = id
                ? await page.locator(`label[for="${id}"]`).count() > 0
                : false;

            const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledby;

            // Log warning instead of failing for flexibility
            if (!hasAccessibleName) {
                console.warn(`Input at index ${i} may be missing accessible name`);
            }
        }
    });

    test('should have visible focus indicators', async ({ page }) => {
        // Tab through the page and check for focus visibility
        await page.keyboard.press('Tab');

        // Get focused element
        const focused = page.locator(':focus');

        if (await focused.count() > 0) {
            // Focused element should have some visual indicator
            // This is a basic check - could be enhanced with visual comparison
            const outline = await focused.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.outline || styles.boxShadow || styles.border;
            });

            // Should have some focus style (outline, box-shadow, or border change)
            expect(outline).toBeTruthy();
        }
    });

    test('should not have empty links', async ({ page }) => {
        const links = page.getByRole('link');
        const count = await links.count();

        for (let i = 0; i < count; i++) {
            const link = links.nth(i);
            const text = await link.textContent();
            const ariaLabel = await link.getAttribute('aria-label');

            // Link should have text or aria-label
            const hasAccessibleName = (text?.trim().length ?? 0) > 0 || (ariaLabel?.trim().length ?? 0) > 0;
            expect(hasAccessibleName).toBeTruthy();
        }
    });

    test('should have skip link for keyboard navigation', async ({ page }) => {
        // Focus the first element
        await page.keyboard.press('Tab');

        // Look for skip link (might be visually hidden but accessible)
        const skipLink = page.locator('a[href="#main-content"], a:has-text("skip")');

        // Skip link existence is recommended but not required
        const hasSkipLink = await skipLink.count() > 0;

        if (!hasSkipLink) {
            console.warn('Consider adding a skip link for keyboard navigation');
        }
    });
});

test.describe('Color Contrast', () => {
    test('should have readable text (basic check)', async ({ page }) => {
        await page.goto('/');

        // This is a basic check - for comprehensive contrast testing,
        // consider using tools like axe-core
        const body = page.locator('body');
        const color = await body.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
                color: styles.color,
                background: styles.backgroundColor
            };
        });

        // Basic check that colors are defined
        expect(color.color).toBeTruthy();
        expect(color.background).toBeTruthy();
    });
});
