import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

export const TEST_PWD = process.env.E2E_TEST_PASSWORD || 'test123456';

export async function loginAs(page: Page, email: string, password = TEST_PWD) {
    await page.goto(BASE_URL);

    // Wait for login form
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    await emailInput.fill(email);
    const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    await passwordInput.fill(password);

    await page.getByRole('button', { name: /sign in|login|submit/i }).click();

    // Wait for successful login (dashboard or similar)
    // We wait for URL to not be login or to contain dashboard, or specific element
    await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
}
