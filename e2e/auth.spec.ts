/**
 * E2E Tests: Login and Authentication Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('/');
    });

    test('should display login page', async ({ page }) => {
        // Check for login form elements
        await expect(page.getByRole('heading', { name: /sign in|login|welcome/i })).toBeVisible();

        // Look for email/password inputs
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // Check for submit button
        await expect(page.getByRole('button', { name: /sign in|login|submit/i })).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
        // Click login without filling form
        await page.getByRole('button', { name: /sign in|login|submit/i }).click();

        // Should show validation errors
        await expect(page.getByText(/email.*required|required.*email/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        // Fill in invalid credentials
        await page.getByLabel(/email/i).fill('invalid@example.com');
        await page.getByLabel(/password/i).fill('wrongpassword');

        // Submit
        await page.getByRole('button', { name: /sign in|login|submit/i }).click();

        // Should show error
        await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible({ timeout: 5000 });
    });

    test('should be accessible via keyboard', async ({ page }) => {
        // Tab to email
        await page.keyboard.press('Tab');
        await expect(page.getByLabel(/email/i)).toBeFocused();

        // Tab to password
        await page.keyboard.press('Tab');
        await expect(page.getByLabel(/password/i)).toBeFocused();

        // Tab to submit button
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: /sign in|login|submit/i })).toBeFocused();
    });
});

test.describe('Login with Mock Data', () => {
    test('should login with demo credentials when mock mode is enabled', async ({ page }) => {
        await page.goto('/');

        // Check if there's a demo/mock login option
        const demoButton = page.getByRole('button', { name: /demo|mock|guest/i });

        if (await demoButton.isVisible()) {
            await demoButton.click();

            // Should navigate to dashboard
            await expect(page).toHaveURL(/dashboard/i);

            // Dashboard should load
            await expect(page.getByText(/dashboard|overview|welcome/i)).toBeVisible();
        }
    });
});
