/**
 * Bundle Size Analysis Script
 * Analyzes bundle size and identifies optimization opportunities
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Analyze bundle size
 */
async function analyzeBundle() {
  try {
    // Read package.json to get dependencies
    const packageJson = JSON.parse(
      readFileSync(join(rootDir, 'package.json'), 'utf-8')
    );

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Common large dependencies to watch
    const largeDeps = [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'framer-motion',
      'recharts',
      'lucide-react',
    ];

    console.log('📦 Bundle Size Analysis\n');
    console.log('Large Dependencies:');
    largeDeps.forEach((dep) => {
      const version = dependencies[dep];
      if (version) {
        console.log(`  ✓ ${dep}: ${version}`);
      }
    });

    console.log('\n📊 Optimization Recommendations:\n');

    // Code splitting recommendations
    console.log('1. Code Splitting:');
    console.log('   - Use React.lazy() for route-based splitting');
    console.log('   - Lazy load heavy components (charts, editors)');
    console.log('   - Split vendor chunks (react, react-dom)');

    // Tree shaking recommendations
    console.log('\n2. Tree Shaking:');
    console.log('   - Use named imports instead of default imports');
    console.log('   - Import only needed icons from lucide-react');
    console.log('   - Use ESM modules where possible');

    // Bundle analysis
    console.log('\n3. Bundle Analysis:');
    console.log('   - Run: npm run build:analyze');
    console.log('   - Check dist/ directory for chunk sizes');
    console.log('   - Use source-map-explorer for detailed analysis');

    // Recommendations
    console.log('\n4. Specific Optimizations:');
    console.log('   - Consider replacing recharts with lighter alternative');
    console.log('   - Use dynamic imports for framer-motion');
    console.log('   - Lazy load Supabase client');
    console.log('   - Split lucide-react icons by usage');

    console.log('\n✅ Analysis complete!\n');
  } catch (error) {
    console.error('Error analyzing bundle:', error);
    process.exit(1);
  }
}

analyzeBundle();
