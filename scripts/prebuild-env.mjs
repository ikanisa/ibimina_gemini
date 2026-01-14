#!/usr/bin/env node
/**
 * Cloudflare Pages prebuild script
 * 
 * Cloudflare Pages may set env vars in process.env, but Vite's loadEnv() 
 * only reads from .env files. This script supplements .env.production 
 * with any additional env vars from process.env.
 * 
 * IMPORTANT: Do NOT overwrite .env.production if no env vars are found
 * in process.env - the committed .env.production should be used as fallback.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const VITE_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_USE_MOCK_DATA',
    'VITE_APP_VERSION',
    'VITE_SENTRY_DSN',
];

console.log('[Prebuild] Checking environment variables...');

// Read existing .env.production if it exists
const envPath = '.env.production';
let existingEnv = {};
if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key) {
                existingEnv[key] = valueParts.join('=');
            }
        }
    }
    console.log(`[Prebuild] Found existing .env.production with ${Object.keys(existingEnv).length} vars`);
}

// Check process.env for any overrides
const processEnvVars = {};
for (const varName of VITE_VARS) {
    const value = process.env[varName];
    if (value) {
        processEnvVars[varName] = value;
        console.log(`[Prebuild] Found ${varName} in process.env: ${value.substring(0, 30)}...`);
    }
}

// Merge: process.env overrides .env.production
const merged = { ...existingEnv, ...processEnvVars };

// Only write if we have any vars
const mergedKeys = Object.keys(merged);
if (mergedKeys.length > 0) {
    const lines = mergedKeys.map(key => `${key}=${merged[key]}`);
    writeFileSync(envPath, lines.join('\n') + '\n');
    console.log(`[Prebuild] Wrote ${mergedKeys.length} vars to .env.production`);
} else {
    console.log('[Prebuild] No env vars found - keeping existing .env.production');
}

// Final check - list what will be used
console.log('[Prebuild] Final env vars for build:');
for (const varName of VITE_VARS) {
    const value = merged[varName];
    if (value) {
        console.log(`  ✓ ${varName}: ${value.substring(0, 40)}...`);
    } else {
        console.log(`  ✗ ${varName}: NOT SET`);
    }
}
