import { test, expect } from '@playwright/test';

test('Provision Staff Profile', async ({ page }) => {
    // 1. Login as staff.a@test.com to get User ID
    console.log('Logging in as staff.a@test.com to get ID...');
    await page.goto(process.env.E2E_BASE_URL || 'http://localhost:3002');

    await page.fill('input[id="email"]', 'staff.a@test.com');
    await page.fill('input[id="password"]', 'test123456');
    await page.click('button[type="submit"]');

    // Wait for session storage
    await page.waitForTimeout(5000);

    const userId = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (!key) return null;
        const session = JSON.parse(localStorage.getItem(key) || '{}');
        return session.user?.id;
    });

    if (!userId) {
        throw new Error('Failed to retrieve User ID for staff.a@test.com');
    }
    console.log(`Found User ID: ${userId}`);

    // Logout
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Login as Admin (staff@test.com) to get Token
    console.log('Logging in as Admin (staff@test.com)...');
    await page.fill('input[id="email"]', 'staff@test.com');
    await page.fill('input[id="password"]', 'test123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000); // Wait for session

    const adminToken = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (!key) return null;
        const session = JSON.parse(localStorage.getItem(key) || '{}');
        return session.access_token;
    });

    if (!adminToken) throw new Error('Failed to get Admin token');
    console.log('Got Admin Token');

    // 3. API Actions
    const supabaseUrl = 'https://wadhydemushqqtcrrlwm.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGh5ZGVtdXNocXF0Y3JybHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDE1NTQsImV4cCI6MjA4MTMxNzU1NH0.9O6NMVpat63LnFO7hb9dLy0pz8lrMP0ZwGbIC68rdGI';

    const headers = {
        'Authorization': `Bearer ${adminToken}`, // Use ADMIN token for RLS bypass!
        'apikey': anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // Get Institution
    console.log('Fetching institution...');
    const instRes = await page.request.get(`${supabaseUrl}/rest/v1/institutions?select=id&limit=1`, { headers });
    const instData = await instRes.json();
    const institutionId = instData?.[0]?.id;

    if (!institutionId) {
        console.log('No institutions found? Creating one...');
        // Logic to create institution if needed, but likely exists
        throw new Error('No institution found');
    }
    console.log(`Using Institution: ${institutionId}`);

    // Upsert Profile
    console.log(`Upserting profile for ${userId}...`);
    const upsertRes = await page.request.post(`${supabaseUrl}/rest/v1/profiles`, {
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
        data: {
            user_id: userId,
            email: 'staff.a@test.com',
            full_name: 'Provisioned Staff',
            role: 'INSTITUTION_STAFF',
            institution_id: institutionId,
            status: 'ACTIVE'
        }
    });

    if (!upsertRes.ok) {
        console.log('Upsert failed:', await upsertRes.text());
        throw new Error('Profile upsert failed');
    } else {
        console.log('Profile upserted:', await upsertRes.json());
    }
});
