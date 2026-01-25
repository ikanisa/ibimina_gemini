#!/usr/bin/env node

/**
 * Bundle Size Audit Script
 * Analyzes the production build for size optimization opportunities
 * 
 * Run: node scripts/bundle-audit.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist', 'assets');
const SIZE_BUDGET_KB = 500; // Target initial bundle size

// ============================================================================
// HELPERS
// ============================================================================

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getGzipSize(filePath) {
    // Estimate gzip size as ~30% of original for JS
    const stats = fs.statSync(filePath);
    return Math.round(stats.size * 0.3);
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

function analyzeBundle() {
    console.log('\n📦 Bundle Size Audit\n');
    console.log('='.repeat(60));

    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ No dist/assets directory found. Run `npm run build` first.');
        process.exit(1);
    }

    const files = fs.readdirSync(DIST_DIR);
    const jsFiles = files.filter(f => f.endsWith('.js')).sort((a, b) => {
        const sizeA = fs.statSync(path.join(DIST_DIR, a)).size;
        const sizeB = fs.statSync(path.join(DIST_DIR, b)).size;
        return sizeB - sizeA;
    });

    let totalSize = 0;
    let totalGzip = 0;
    const chunks = [];

    console.log('\n📄 JavaScript Chunks (largest first):\n');

    jsFiles.forEach(file => {
        const filePath = path.join(DIST_DIR, file);
        const stats = fs.statSync(filePath);
        const gzipSize = getGzipSize(filePath);

        totalSize += stats.size;
        totalGzip += gzipSize;

        chunks.push({
            name: file,
            size: stats.size,
            gzip: gzipSize,
        });

        const icon = stats.size > 100 * 1024 ? '🔴' : stats.size > 50 * 1024 ? '🟡' : '🟢';
        console.log(`${icon} ${file}`);
        console.log(`   Size: ${formatBytes(stats.size)} | Gzip: ~${formatBytes(gzipSize)}`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:\n');
    console.log(`   Total JS:       ${formatBytes(totalSize)}`);
    console.log(`   Total Gzip:     ~${formatBytes(totalGzip)}`);
    console.log(`   Budget:         ${SIZE_BUDGET_KB} KB (gzip)`);

    const overBudget = totalGzip > SIZE_BUDGET_KB * 1024;
    if (overBudget) {
        console.log(`\n   ⚠️  Over budget by ${formatBytes(totalGzip - SIZE_BUDGET_KB * 1024)}`);
    } else {
        console.log(`\n   ✅ Within budget (${formatBytes(SIZE_BUDGET_KB * 1024 - totalGzip)} under)`);
    }

    // Recommendations
    console.log('\n📝 Recommendations:\n');

    const largeChunks = chunks.filter(c => c.size > 100 * 1024);
    if (largeChunks.length > 0) {
        console.log('   Large chunks to review:');
        largeChunks.forEach(c => {
            console.log(`   - ${c.name}: Consider code splitting or lazy loading`);
        });
    }

    // Check for common optimizations
    const vendorChunks = chunks.filter(c => c.name.includes('vendor'));
    if (vendorChunks.length > 0) {
        const vendorTotal = vendorChunks.reduce((acc, c) => acc + c.size, 0);
        if (vendorTotal > 300 * 1024) {
            console.log('\n   Vendor chunks are large. Consider:');
            console.log('   - Audit lodash imports (use lodash-es with tree shaking)');
            console.log('   - Check for duplicate dependencies');
            console.log('   - Use dynamic imports for large libraries');
        }
    }

    // Check for index chunk (main bundle)
    const indexChunk = chunks.find(c => c.name.includes('index'));
    if (indexChunk && indexChunk.size > 150 * 1024) {
        console.log('\n   Main bundle is large. Consider:');
        console.log('   - Move heavy components to lazy routes');
        console.log('   - Code split by route');
        console.log('   - Extract shared utilities to separate chunk');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Audit complete.\n');

    // Return exit code based on budget
    return overBudget ? 1 : 0;
}

// Run
const exitCode = analyzeBundle();
process.exit(exitCode);
