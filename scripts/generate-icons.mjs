#!/usr/bin/env node
/**
 * Generate all required icon sizes from a source SACCO logo image
 * Usage: node scripts/generate-icons.mjs path/to/sacco-logo.png
 * 
 * Requirements: npm install sharp (or it will prompt to install)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_IMAGE = process.argv[2];
const ICONS_DIR = path.join(__dirname, '../public/icons');
const PROJECT_ROOT = path.join(__dirname, '..');

if (!SOURCE_IMAGE) {
  console.error('Usage: node scripts/generate-icons.mjs path/to/sacco-logo.png');
  console.error('');
  console.error('This script generates all required icon sizes from your SACCO logo.');
  console.error('The source image should be at least 512x512 pixels for best results.');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/generate-icons.mjs sacco-logo.png');
  console.error('  npm run generate-icons sacco-logo.png');
  process.exit(1);
}

const sourcePath = path.isAbsolute(SOURCE_IMAGE) 
  ? SOURCE_IMAGE 
  : path.join(PROJECT_ROOT, SOURCE_IMAGE);

if (!fs.existsSync(sourcePath)) {
  console.error(`Error: Source image not found: ${sourcePath}`);
  console.error(`Looking for: ${sourcePath}`);
  process.exit(1);
}

// Check if sharp is installed, offer to install if not
let sharp;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default;
} catch (e) {
  console.error('Error: "sharp" package is required but not installed.');
  console.error('Installing sharp...');
  try {
    execSync('npm install sharp --save-dev', { 
      stdio: 'inherit', 
      cwd: PROJECT_ROOT 
    });
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
    console.log('✅ sharp installed successfully!\n');
  } catch (installError) {
    console.error('Failed to install sharp. Please run: npm install sharp --save-dev');
    process.exit(1);
  }
}

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Sizes to generate
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

console.log(`Generating icons from: ${sourcePath}`);
console.log(`Output directory: ${ICONS_DIR}\n`);

async function generateIcons() {
  try {
    // Generate all PNG sizes
    for (const size of sizes) {
      const output = path.join(ICONS_DIR, `icon-${size}.png`);
      process.stdout.write(`Generating ${size}x${size}... `);
      
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(output);
      
      console.log('✅');
    }

    // Create favicon (copy 32x32 as favicon - modern browsers support PNG)
    const faviconPath = path.join(PROJECT_ROOT, 'public/favicon.ico');
    process.stdout.write('\nGenerating favicon.ico... ');
    
    // Copy 32x32 as favicon (browsers accept PNG as favicon now)
    fs.copyFileSync(
      path.join(ICONS_DIR, 'icon-32.png'),
      faviconPath
    );
    
    console.log('✅');

    console.log('\n✅ All icons generated successfully!');
    console.log(`\nIcons created in: ${ICONS_DIR}`);
    console.log(`Favicon created: ${faviconPath}`);
    console.log('\nRequired sizes generated:');
    sizes.forEach(size => {
      console.log(`  ✅ icon-${size}.png`);
    });
    console.log('  ✅ favicon.ico\n');
    
    console.log('Note: Modern browsers support PNG favicons.');
    console.log('For true ICO format with multiple resolutions, use the ImageMagick script:\n');
    console.log('  npm run generate-icons:bash sacco-logo.png\n');

  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    if (error.code === 'ENOENT') {
      console.error('Make sure the source image path is correct.');
    }
    process.exit(1);
  }
}

generateIcons();
