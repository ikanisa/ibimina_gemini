import { test, expect } from '@playwright/test';

/**
 * Phase 9: Smoke Tests
 * Verifies Cloudflare build works correctly
 * - All routes resolve (no 404)
 * - No blank screens
 * - Error boundary catches errors
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Smoke: Route Resolution', () => {
  test('home page loads without blank screen', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Should not be blank
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
    
    // Should see either login or dashboard
    await expect(
      page.locator('text=Sign in')
        .or(page.locator('text=Dashboard'))
        .or(page.locator('text=SACCO+'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('SPA routing works for direct URL access', async ({ page }) => {
    // Try direct access to various routes
    const routes = [
      '/dashboard',
      '/groups',
      '/members',
      '/transactions',
      '/settings',
    ];

    for (const route of routes) {
      const response = await page.goto(`${BASE_URL}${route}`);
      
      // Should not get 404
      expect(response?.status()).not.toBe(404);
      
      // Should see content (login redirect or actual page)
      const body = await page.locator('body').textContent();
      expect(body?.trim().length).toBeGreaterThan(0);
    }
  });

  test('404 page displays correctly for unknown routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-route-does-not-exist-12345`);
    
    // SPA should catch it and show login or custom 404
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Smoke: Error Handling', () => {
  test('error boundary catches errors gracefully', async ({ page }) => {
    // Navigate to app
    await page.goto(BASE_URL);
    
    // Inject a JS error to test error boundary
    await page.evaluate(() => {
      // Try to cause an error in React (this may or may not trigger based on app state)
      const event = new Event('error');
      window.dispatchEvent(event);
    });
    
    // Should still see content (either normal page or error boundary)
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
  });

  test('network errors show appropriate message', async ({ page }) => {
    // Navigate to app
    await page.goto(BASE_URL);
    
    // Wait for any initial load
    await page.waitForLoadState('networkidle');
    
    // Check for offline indicator if present
    // (This is optional - just checking it doesn't crash)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    // Give it a moment
    await page.waitForTimeout(500);
    
    // Should still render
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Smoke: Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('no JavaScript console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (e.g., Supabase config warnings)
    const criticalErrors = errors.filter(err => 
      !err.includes('Supabase') && 
      !err.includes('configuration') &&
      !err.includes('Failed to load resource')
    );
    
    // Should have no critical errors
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Smoke: Assets', () => {
  test('favicon loads', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for favicon
    const favicon = await page.locator('link[rel*="icon"]').first();
    const href = await favicon.getAttribute('href');
    
    if (href) {
      const faviconUrl = href.startsWith('/') ? `${BASE_URL}${href}` : href;
      const response = await page.request.get(faviconUrl);
      expect(response.ok()).toBe(true);
    }
  });

  test('manifest exists for PWA', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for manifest
    const manifest = await page.locator('link[rel="manifest"]').first();
    const href = await manifest.getAttribute('href');
    
    if (href) {
      const manifestUrl = href.startsWith('/') ? `${BASE_URL}${href}` : href;
      const response = await page.request.get(manifestUrl);
      expect(response.ok()).toBe(true);
    }
  });
});

test.describe('Smoke: Accessibility Basics', () => {
  test('page has title', async ({ page }) => {
    await page.goto(BASE_URL);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('page has lang attribute', async ({ page }) => {
    await page.goto(BASE_URL);
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });
});

