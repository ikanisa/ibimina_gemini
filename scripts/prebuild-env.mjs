#!/usr/bin/env node
/**
 * Cloudflare Pages prebuild script
 * 
 * Cloudflare Pages sets env vars in process.env, but Vite's loadEnv() only reads from .env files.
 * This script creates .env.production from process.env so Vite can pick them up.
 */

import { writeFileSync } from 'fs';

const VITE_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_USE_MOCK_DATA',
    'VITE_APP_VERSION',
    'VITE_SENTRY_DSN',
];

console.log('[Prebuild] Checking environment variables...');

const envLines = [];

for (const varName of VITE_VARS) {
    const value = process.env[varName];
    if (value) {
        envLines.push(`${varName}=${value}`);
        console.log(`[Prebuild] Found ${varName}: ${value.substring(0, 30)}...`);
    } else {
        console.log(`[Prebuild] Missing ${varName}`);
    }
}

if (envLines.length > 0) {
    const envContent = envLines.join('\n') + '\n';
    writeFileSync('.env.production', envContent);
    console.log(`[Prebuild] Created .env.production with ${envLines.length} variables`);
} else {
    console.log('[Prebuild] No VITE_ env vars found in process.env');
}
