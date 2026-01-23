import { test, expect } from '@playwright/test';

const candidates = [
    { email: 'staff.a@test.com', password: 'test123456' },
    { email: 'staff1@test.com', password: 'password123' },
    { email: 'member@test.com', password: 'test123456' },
];

test.describe('User Discovery', () => {
    for (const user of candidates) {
        test(`Try login: ${user.email} / ${user.password}`, async ({ page }) => {
            // Listen for browser console logs
            page.on('console', msg => {
                const text = msg.text();
                if (text.includes('[DEBUG]') || text.includes('ROLECHECK')) {
                    console.log(`[BROWSER] ${text}`);
                }
            });

            await page.goto(process.env.E2E_BASE_URL || 'http://localhost:3002');

            // Wait for email input
            await page.waitForSelector('input[id="email"]', { timeout: 5000 }).catch(() => { });
            if (!await page.isVisible('input[id="email"]')) {
                console.log(`[${user.email}] Already logged in? Clearing context.`);
                await page.context().clearCookies();
                await page.reload();
            }

            await page.fill('input[id="email"]', user.email);
            await page.fill('input[id="password"]', user.password);
            await page.click('button[type="submit"]');

            try {
                await Promise.race([
                    page.waitForURL(/.*dashboard/, { timeout: 8000 }),
                    page.waitForSelector('text=Invalid login credentials', { timeout: 5000 }),
                    page.waitForSelector('text=error', { timeout: 5000 })
                ]);

                if (page.url().includes('dashboard')) {
                    console.log(`SUCCESS: ${user.email} logged in!`);

                    // Wait for App.tsx to render and log
                    await page.waitForTimeout(2000);

                    // Check for Admin nav
                    const adminItem = page.locator('text=Institutions');
                    if (await adminItem.isVisible()) {
                        console.log(`ROLECHECK: ${user.email} sees Institutions -> Likely ADMIN`);
                    } else {
                        console.log(`ROLECHECK: ${user.email} does NOT see Institutions -> Likely STAFF`);
                    }
                } else {
                    console.log(`FAILED: ${user.email} - Invalid credentials`);
                }
            } catch (e) {
                console.log(`TIMEOUT: ${user.email} - No response`);
            }
        });
    }
});
