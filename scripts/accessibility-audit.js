#!/usr/bin/env node

/**
 * Accessibility Audit Script
 * 
 * Runs automated accessibility checks using axe-core
 * 
 * Usage:
 *   node scripts/accessibility-audit.js
 *   node scripts/accessibility-audit.js --url http://localhost:5173
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = process.argv.includes('--url') 
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:5173';

const OUTPUT_DIR = path.join(process.cwd(), 'test-results', 'accessibility');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'audit-report.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runAccessibilityAudit() {
  console.log('🔍 Starting accessibility audit...');
  console.log(`📍 Target URL: ${TARGET_URL}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Inject axe-core
    const axeScript = fs.readFileSync(
      path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
      'utf8'
    );
    await page.addScriptTag({ content: axeScript });

    // Navigate to page
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

    // Wait for React to render
    await page.waitForTimeout(2000);

    // Run axe-core audit
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        axe.run((err, results) => {
          if (err) {
            resolve({ error: err.message });
          } else {
            resolve(results);
          }
        });
      });
    });

    // Save results
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

    // Print summary
    if (results.violations) {
      console.log(`❌ Found ${results.violations.length} accessibility violations:\n`);
      
      results.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Nodes affected: ${violation.nodes.length}`);
        if (violation.nodes.length > 0) {
          console.log(`   Example: ${violation.nodes[0].html.substring(0, 100)}...`);
        }
        console.log('');
      });
    } else {
      console.log('✅ No accessibility violations found!');
    }

    if (results.incomplete && results.incomplete.length > 0) {
      console.log(`⚠️  ${results.incomplete.length} incomplete checks (manual review needed)\n`);
    }

    if (results.passes && results.passes.length > 0) {
      console.log(`✅ ${results.passes.length} accessibility checks passed\n`);
    }

    console.log(`📄 Full report saved to: ${OUTPUT_FILE}`);

    // Exit with error code if violations found
    if (results.violations && results.violations.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running accessibility audit:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Check if axe-core is installed
const axePath = path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');
if (!fs.existsSync(axePath)) {
  console.error('❌ axe-core not found. Please install it:');
  console.error('   npm install --save-dev axe-core');
  process.exit(1);
}

runAccessibilityAudit();
