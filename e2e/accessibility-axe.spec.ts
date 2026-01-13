/**
 * E2E Tests: Accessibility with axe-core
 * Comprehensive accessibility testing using axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test.describe('Accessibility: axe-core Audit', () => {
  test('should have no accessibility violations on login page', async ({ page }) => {
    await page.goto(BASE_URL);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations on dashboard', async ({ page }) => {
    // Login first
    await page.goto(BASE_URL);
    await page.getByLabel(/email/i).fill(process.env.E2E_STAFF_EMAIL || 'staff@test.com');
    await page.getByLabel(/password/i).fill(process.env.E2E_STAFF_PASSWORD || 'Test123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 }).catch(() => {});

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Nodes: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no critical accessibility violations on transactions page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByLabel(/email/i).fill(process.env.E2E_STAFF_EMAIL || 'staff@test.com');
    await page.getByLabel(/password/i).fill(process.env.E2E_STAFF_PASSWORD || 'Test123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 }).catch(() => {});

    await page.getByRole('link', { name: /transactions/i }).click();
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter out minor violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByLabel(/email/i).fill(process.env.E2E_STAFF_EMAIL || 'staff@test.com');
    await page.getByLabel(/password/i).fill(process.env.E2E_STAFF_PASSWORD || 'Test123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 }).catch(() => {});

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules({ 'color-contrast': { enabled: true } })
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should have keyboard accessible interactive elements', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByLabel(/email/i).fill(process.env.E2E_STAFF_EMAIL || 'staff@test.com');
    await page.getByLabel(/password/i).fill(process.env.E2E_STAFF_PASSWORD || 'Test123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 }).catch(() => {});

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['keyboard'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
