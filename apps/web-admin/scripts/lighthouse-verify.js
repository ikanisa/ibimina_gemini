#!/usr/bin/env node

/**
 * Lighthouse Score Verification Script
 * Runs Lighthouse audits and reports scores
 * 
 * Usage: npx lhci autorun --config=lighthouse-ci.json
 * Or: node scripts/lighthouse-verify.js (for summary)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCORE_THRESHOLDS = {
    performance: 85,
    accessibility: 90,
    'best-practices': 90,
    seo: 85,
    pwa: 80,
};

// ============================================================================
// HELPERS
// ============================================================================

function formatScore(score) {
    const percentage = Math.round(score * 100);
    const icon = percentage >= 90 ? '🟢' : percentage >= 70 ? '🟡' : '🔴';
    return `${icon} ${percentage}%`;
}

function meetsThreshold(category, score) {
    const threshold = SCORE_THRESHOLDS[category];
    return Math.round(score * 100) >= threshold;
}

// ============================================================================
// MAIN
// ============================================================================

function printLighthouseInstructions() {
    console.log('\n🔍 Lighthouse Score Verification\n');
    console.log('='.repeat(60));

    console.log('\n📋 Score Thresholds:\n');
    Object.entries(SCORE_THRESHOLDS).forEach(([category, threshold]) => {
        console.log(`   ${category.padEnd(15)} >= ${threshold}%`);
    });

    console.log('\n📦 To run Lighthouse audit:\n');
    console.log('   Option 1: Browser DevTools');
    console.log('   - Open Chrome DevTools (F12)');
    console.log('   - Go to "Lighthouse" tab');
    console.log('   - Select categories and run audit\n');

    console.log('   Option 2: Lighthouse CI');
    console.log('   $ npm install -g @lhci/cli');
    console.log('   $ npm run build');
    console.log('   $ npx lhci autorun --config=lighthouse-ci.json\n');

    console.log('   Option 3: PageSpeed Insights');
    console.log('   https://pagespeed.web.dev/\n');

    console.log('='.repeat(60));

    // Check if lhci results exist
    const lhciDir = path.join(__dirname, '..', '.lighthouseci');
    if (fs.existsSync(lhciDir)) {
        console.log('\n📊 Found .lighthouseci results directory');

        // Try to read manifest
        const manifestPath = path.join(lhciDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                console.log('\n📈 Latest Audit Results:\n');

                manifest.forEach((entry) => {
                    if (entry.summary) {
                        console.log(`   URL: ${entry.url}`);
                        Object.entries(entry.summary).forEach(([category, score]) => {
                            const passes = meetsThreshold(category, score);
                            console.log(`   ${category.padEnd(15)} ${formatScore(score)} ${passes ? '✅' : '❌'}`);
                        });
                        console.log('');
                    }
                });
            } catch (err) {
                console.log('   Could not parse manifest.json');
            }
        }
    } else {
        console.log('\n⚠️  No .lighthouseci results found. Run an audit first.\n');
    }

    console.log('\n✨ Verification script complete.\n');
}

printLighthouseInstructions();
