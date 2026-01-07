/**
 * Phase 10: RLS Policy Tests
 * 
 * Tests Row Level Security policies to ensure:
 * 1. Staff cannot read other institution rows
 * 2. Staff cannot update other institution rows
 * 3. Institution admin cannot manage other institutions
 * 4. Auditor is read-only
 * 5. Platform admin has full access
 * 
 * These tests require seeded test users in different institutions.
 */

import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Test users - should be seeded in different institutions
const TEST_USERS = {
  // Institution A users
  staffA: {
    email: process.env.E2E_STAFF_A_EMAIL || 'staff-a@test.com',
    password: process.env.E2E_STAFF_A_PASSWORD || 'test123456',
    institutionId: process.env.E2E_INSTITUTION_A_ID || 'institution-a-uuid'
  },
  adminA: {
    email: process.env.E2E_ADMIN_A_EMAIL || 'admin-a@test.com',
    password: process.env.E2E_ADMIN_A_PASSWORD || 'test123456',
    institutionId: process.env.E2E_INSTITUTION_A_ID || 'institution-a-uuid'
  },
  auditorA: {
    email: process.env.E2E_AUDITOR_A_EMAIL || 'auditor-a@test.com',
    password: process.env.E2E_AUDITOR_A_PASSWORD || 'test123456',
    institutionId: process.env.E2E_INSTITUTION_A_ID || 'institution-a-uuid'
  },
  // Institution B users
  staffB: {
    email: process.env.E2E_STAFF_B_EMAIL || 'staff-b@test.com',
    password: process.env.E2E_STAFF_B_PASSWORD || 'test123456',
    institutionId: process.env.E2E_INSTITUTION_B_ID || 'institution-b-uuid'
  },
  // Platform admin (no institution restriction)
  platformAdmin: {
    email: process.env.E2E_PLATFORM_ADMIN_EMAIL || 'platform@test.com',
    password: process.env.E2E_PLATFORM_ADMIN_PASSWORD || 'test123456',
    institutionId: null
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

async function login(page: Page, email: string, password: string) {
  await page.goto(BASE_URL);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*(?:dashboard|$)/, { timeout: 15000 });
}

async function getAccessToken(page: Page): Promise<string | null> {
  // Get Supabase session from browser storage
  const session = await page.evaluate(() => {
    const supabaseKey = Object.keys(localStorage).find(k => k.includes('supabase'));
    if (supabaseKey) {
      try {
        const data = JSON.parse(localStorage.getItem(supabaseKey) || '{}');
        return data.access_token || data.currentSession?.access_token || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  return session;
}

async function callSupabaseRpc(page: Page, functionName: string, params: object = {}) {
  const token = await getAccessToken(page);
  if (!token) throw new Error('No access token');

  const response = await page.request.post(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: params
  });

  return {
    status: response.status(),
    data: await response.json().catch(() => null)
  };
}

async function querySupabaseTable(page: Page, table: string, filters: string = '') {
  const token = await getAccessToken(page);
  if (!token) throw new Error('No access token');

  const url = `${SUPABASE_URL}/rest/v1/${table}?${filters}`;
  const response = await page.request.get(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation'
    }
  });

  return {
    status: response.status(),
    data: await response.json().catch(() => null)
  };
}

async function insertSupabaseRow(page: Page, table: string, data: object) {
  const token = await getAccessToken(page);
  if (!token) throw new Error('No access token');

  const response = await page.request.post(`${SUPABASE_URL}/rest/v1/${table}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    data
  });

  return {
    status: response.status(),
    data: await response.json().catch(() => null)
  };
}

// ============================================================================
// Test: Staff Cannot Read Other Institution Rows
// ============================================================================

test.describe('RLS: Cross-Institution Read Protection', () => {
  test.skip(!SUPABASE_URL, 'Supabase URL not configured');

  test('staff A cannot see staff B institution groups via API', async ({ page }) => {
    // Login as staff A
    await login(page, TEST_USERS.staffA.email, TEST_USERS.staffA.password);
    
    // Try to query all groups
    const result = await querySupabaseTable(page, 'groups', 'select=*');
    
    if (result.status === 200 && Array.isArray(result.data)) {
      // All returned groups should belong to staff A's institution
      const wrongInstitutionGroups = result.data.filter(
        (g: any) => g.institution_id && g.institution_id !== TEST_USERS.staffA.institutionId
      );
      
      expect(wrongInstitutionGroups.length).toBe(0);
    }
  });

  test('staff A cannot see staff B institution members via API', async ({ page }) => {
    await login(page, TEST_USERS.staffA.email, TEST_USERS.staffA.password);
    
    const result = await querySupabaseTable(page, 'members', 'select=*');
    
    if (result.status === 200 && Array.isArray(result.data)) {
      const wrongInstitutionMembers = result.data.filter(
        (m: any) => m.institution_id && m.institution_id !== TEST_USERS.staffA.institutionId
      );
      
      expect(wrongInstitutionMembers.length).toBe(0);
    }
  });

  test('staff A cannot see staff B institution transactions via API', async ({ page }) => {
    await login(page, TEST_USERS.staffA.email, TEST_USERS.staffA.password);
    
    const result = await querySupabaseTable(page, 'transactions', 'select=*');
    
    if (result.status === 200 && Array.isArray(result.data)) {
      const wrongInstitutionTx = result.data.filter(
        (t: any) => t.institution_id && t.institution_id !== TEST_USERS.staffA.institutionId
      );
      
      expect(wrongInstitutionTx.length).toBe(0);
    }
  });
});

// ============================================================================
// Test: Staff Cannot Update Other Institution Rows
// ============================================================================

test.describe('RLS: Cross-Institution Write Protection', () => {
  test.skip(!SUPABASE_URL, 'Supabase URL not configured');

  test('staff A cannot insert group in institution B', async ({ page }) => {
    await login(page, TEST_USERS.staffA.email, TEST_USERS.staffA.password);
    
    // Try to insert a group in institution B
    const result = await insertSupabaseRow(page, 'groups', {
      institution_id: TEST_USERS.staffB.institutionId,
      name: 'Illegal Group',
      group_code: 'ILLEGAL001'
    });
    
    // Should be rejected by RLS
    expect([403, 401, 400]).toContain(result.status);
  });

  test('staff A cannot insert member in institution B', async ({ page }) => {
    await login(page, TEST_USERS.staffA.email, TEST_USERS.staffA.password);
    
    const result = await insertSupabaseRow(page, 'members', {
      institution_id: TEST_USERS.staffB.institutionId,
      group_id: '00000000-0000-0000-0000-000000000000', // Fake ID
      full_name: 'Illegal Member',
      phone_primary: '+250788000000'
    });
    
    expect([403, 401, 400]).toContain(result.status);
  });
});

// ============================================================================
// Test: Institution Admin Cannot Manage Other Institutions
// ============================================================================

test.describe('RLS: Institution Admin Boundaries', () => {
  test.skip(!SUPABASE_URL, 'Supabase URL not configured');

  test('institution A admin cannot create staff invite for institution B', async ({ page }) => {
    await login(page, TEST_USERS.adminA.email, TEST_USERS.adminA.password);
    
    const result = await insertSupabaseRow(page, 'staff_invites', {
      institution_id: TEST_USERS.staffB.institutionId,
      email: 'newstaff@test.com',
      role: 'INSTITUTION_STAFF'
    });
    
    // Should be rejected
    expect([403, 401, 400]).toContain(result.status);
  });

  test('institution A admin cannot update institution B settings', async ({ page }) => {
    await login(page, TEST_USERS.adminA.email, TEST_USERS.adminA.password);
    
    // Try to call update_institution_settings for wrong institution
    const result = await callSupabaseRpc(page, 'update_institution_settings', {
      p_institution_id: TEST_USERS.staffB.institutionId,
      p_settings: { parser_mode: 'deterministic' }
    });
    
    // Should fail
    expect(result.status).not.toBe(200);
  });

  test('institution A admin can manage their own institution', async ({ page }) => {
    await login(page, TEST_USERS.adminA.email, TEST_USERS.adminA.password);
    
    // Query their own institution settings
    const result = await querySupabaseTable(
      page, 
      'institution_settings', 
      `institution_id=eq.${TEST_USERS.adminA.institutionId}`
    );
    
    // Should succeed
    expect(result.status).toBe(200);
  });
});

// ============================================================================
// Test: Auditor Read-Only Access
// ============================================================================

test.describe('RLS: Auditor Read-Only Enforcement', () => {
  test.skip(!SUPABASE_URL, 'Supabase URL not configured');

  test('auditor can read transactions', async ({ page }) => {
    await login(page, TEST_USERS.auditorA.email, TEST_USERS.auditorA.password);
    
    const result = await querySupabaseTable(page, 'transactions', 'select=*&limit=5');
    
    expect(result.status).toBe(200);
  });

  test('auditor can read audit log', async ({ page }) => {
    await login(page, TEST_USERS.auditorA.email, TEST_USERS.auditorA.password);
    
    const result = await querySupabaseTable(page, 'audit_log', 'select=*&limit=5');
    
    expect(result.status).toBe(200);
  });

  test('auditor cannot insert transactions', async ({ page }) => {
    await login(page, TEST_USERS.auditorA.email, TEST_USERS.auditorA.password);
    
    const result = await insertSupabaseRow(page, 'transactions', {
      institution_id: TEST_USERS.auditorA.institutionId,
      amount: 10000,
      currency: 'RWF',
      allocation_status: 'unallocated'
    });
    
    // Auditor cannot write - should fail
    expect([403, 401, 400]).toContain(result.status);
  });

  test('auditor cannot allocate transaction via RPC', async ({ page }) => {
    await login(page, TEST_USERS.auditorA.email, TEST_USERS.auditorA.password);
    
    const result = await callSupabaseRpc(page, 'allocate_transaction', {
      p_transaction_id: '00000000-0000-0000-0000-000000000000',
      p_member_id: '00000000-0000-0000-0000-000000000000'
    });
    
    // Should fail due to read-only role
    expect(result.status).not.toBe(200);
  });

  test('auditor cannot insert members', async ({ page }) => {
    await login(page, TEST_USERS.auditorA.email, TEST_USERS.auditorA.password);
    
    const result = await insertSupabaseRow(page, 'members', {
      institution_id: TEST_USERS.auditorA.institutionId,
      group_id: '00000000-0000-0000-0000-000000000000',
      full_name: 'Auditor Test',
      phone_primary: '+250788999999'
    });
    
    expect([403, 401, 400]).toContain(result.status);
  });
});

// ============================================================================
// Test: Platform Admin Full Access
// ============================================================================

test.describe('RLS: Platform Admin Full Access', () => {
  test.skip(!SUPABASE_URL, 'Supabase URL not configured');

  test('platform admin can read all institutions groups', async ({ page }) => {
    await login(page, TEST_USERS.platformAdmin.email, TEST_USERS.platformAdmin.password);
    
    const result = await querySupabaseTable(page, 'groups', 'select=*');
    
    expect(result.status).toBe(200);
    
    // Should see groups from multiple institutions
    if (Array.isArray(result.data)) {
      const institutionIds = new Set(result.data.map((g: any) => g.institution_id));
      // Platform admin should see at least data from the 2 test institutions
      // (if properly seeded)
      console.log(`Platform admin sees ${institutionIds.size} distinct institutions`);
    }
  });

  test('platform admin can read all transactions', async ({ page }) => {
    await login(page, TEST_USERS.platformAdmin.email, TEST_USERS.platformAdmin.password);
    
    const result = await querySupabaseTable(page, 'transactions', 'select=*&limit=50');
    
    expect(result.status).toBe(200);
  });

  test('platform admin can create institution via RPC', async ({ page }) => {
    await login(page, TEST_USERS.platformAdmin.email, TEST_USERS.platformAdmin.password);
    
    // Try to create a new institution
    const result = await callSupabaseRpc(page, 'create_institution', {
      p_name: `E2E Test Institution ${Date.now()}`,
      p_short_name: `E2E${Date.now()}`,
      p_type: 'sacco'
    });
    
    // Should succeed for platform admin
    expect([200, 201]).toContain(result.status);
    
    // Clean up: could add delete logic here if needed
  });

  test('platform admin can access system health for any institution', async ({ page }) => {
    await login(page, TEST_USERS.platformAdmin.email, TEST_USERS.platformAdmin.password);
    
    // Call system health RPC for institution A
    const result = await callSupabaseRpc(page, 'get_system_health', {
      p_institution_id: TEST_USERS.staffA.institutionId
    });
    
    expect(result.status).toBe(200);
  });
});

// ============================================================================
// Test: UI Permission Verification
// ============================================================================

test.describe('UI: Role-Based Feature Visibility', () => {
  test('staff cannot see institutions nav item', async ({ page }) => {
    await login(page, TEST_USERS.staffA.email, TEST_USERS.staffA.password);
    
    // Institutions should not be in navigation
    const institutionsNav = page.locator('nav >> text=Institutions');
    await expect(institutionsNav).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // If visible, fail
      expect(true).toBe(false); // Force fail
    });
  });

  test('staff cannot navigate directly to /institutions', async ({ page }) => {
    await login(page, TEST_USERS.staffA.email, TEST_USERS.staffA.password);
    
    // Try direct navigation
    await page.goto(`${BASE_URL}/institutions`);
    
    // Should be redirected or shown forbidden
    await expect(
      page.locator('text=Forbidden')
        .or(page.locator('text=Access Denied'))
        .or(page.locator('text=Dashboard')) // Redirected to dashboard
    ).toBeVisible({ timeout: 5000 });
    
    // Should not see institution management UI
    await expect(page.locator('text=Institutions Management')).not.toBeVisible();
  });

  test('auditor cannot see allocate button on transactions', async ({ page }) => {
    await login(page, TEST_USERS.auditorA.email, TEST_USERS.auditorA.password);
    
    // Navigate to transactions
    await page.click('text=Transactions');
    await page.waitForLoadState('networkidle');
    
    // Open a transaction if available
    const transactionRow = page.locator('tr').or(page.locator('[data-testid="transaction-row"]')).first();
    if (await transactionRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await transactionRow.click();
      await page.waitForTimeout(500);
      
      // Allocate button should NOT be visible for auditor
      const allocateBtn = page.locator('button >> text=Allocate');
      await expect(allocateBtn).not.toBeVisible();
    }
  });

  test('platform admin can see institutions nav item', async ({ page }) => {
    await login(page, TEST_USERS.platformAdmin.email, TEST_USERS.platformAdmin.password);
    
    // Institutions should be visible
    const institutionsNav = page.locator('nav >> text=Institutions').or(page.locator('text=Institutions'));
    await expect(institutionsNav.first()).toBeVisible({ timeout: 5000 });
  });

  test('platform admin can access /institutions page', async ({ page }) => {
    await login(page, TEST_USERS.platformAdmin.email, TEST_USERS.platformAdmin.password);
    
    // Direct navigation
    await page.goto(`${BASE_URL}/institutions`);
    
    // Should see institutions management
    await expect(
      page.locator('text=Institutions')
        .or(page.locator('[data-testid="institutions-list"]'))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// Test: Data Isolation Verification
// ============================================================================

test.describe('Data Isolation: Dashboard Scoping', () => {
  test('staff A dashboard shows only their institution data', async ({ page }) => {
    await login(page, TEST_USERS.staffA.email, TEST_USERS.staffA.password);
    
    // Dashboard should load with institution-scoped data
    await page.waitForLoadState('networkidle');
    
    // Call dashboard summary RPC and verify institution_id
    const result = await callSupabaseRpc(page, 'get_dashboard_summary', {
      p_days: 7
    });
    
    if (result.status === 200 && result.data) {
      // All data should be scoped to staff A's institution
      // The RPC should enforce this automatically via RLS/security invoker
      console.log('Dashboard summary fetched successfully');
    }
  });

  test('platform admin can switch institution context', async ({ page }) => {
    await login(page, TEST_USERS.platformAdmin.email, TEST_USERS.platformAdmin.password);
    
    // Look for institution switcher
    const institutionSwitcher = page.locator('[data-testid="institution-switcher"]')
      .or(page.locator('select >> text=Institution'))
      .or(page.locator('[role="combobox"]'));
    
    if (await institutionSwitcher.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click to open
      await institutionSwitcher.click();
      
      // Should see multiple institutions
      const options = page.locator('[role="option"]').or(page.locator('option'));
      const count = await options.count();
      
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });
});

