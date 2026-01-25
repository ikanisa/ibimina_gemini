import { test, expect } from '@playwright/test';

test('capture console logs', async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER]: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER ERROR]: ${err.message}`));

    try {
        const response = await page.goto(process.env.E2E_BASE_URL || 'http://localhost:3002');
        console.log(`[NAVIGATION] Status: ${response?.status()}`);

        // Wait a bit to let JS execute
        await page.waitForTimeout(3000);

        // Check if root exists
        const root = page.locator('#root');
        console.log(`[DOM] #root visible: ${await root.isVisible()}`);

        // Check content
        const bodyText = await page.textContent('body');
        console.log(`[DOM] Body Text: ${bodyText?.substring(0, 500).replace(/\n/g, ' ')}`);

        const html = await page.content();
        console.log(`[DOM] HTML preview: ${html.substring(0, 500)}...`);
    } catch (e) {
        console.error(`[TEST ERROR] ${e}`);
    }
});
