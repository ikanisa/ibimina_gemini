/**
 * Vite Tree-Shaking Configuration
 * Optimizations for reducing bundle size
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// Tree-shaking optimizations
export const optimizeDeps = {
    // Pre-bundle these to improve dev server startup
    include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
    ],
    // Don't pre-bundle these (they tree-shake better when imported directly)
    exclude: [
        'recharts',
        'framer-motion',
    ],
};

// Rollup manual chunks for optimal code splitting
export const manualChunks = {
    // React core - rarely changes
    'vendor-react': ['react', 'react-dom', 'react-router-dom'],

    // Supabase - large but required
    'vendor-supabase': ['@supabase/supabase-js'],

    // UI libraries - can be lazy loaded
    'vendor-ui': [
        'lucide-react',
        'dompurify',
        'zod',
    ],

    // Heavy libraries - load on demand
    'vendor-charts': ['recharts'],
    'vendor-animation': ['framer-motion'],
};

// Build optimizations
export const buildOptimizations = {
    // Minification with terser for smaller bundles
    minify: 'terser' as const,

    terserOptions: {
        compress: {
            // Remove console.logs in production
            drop_console: true,
            drop_debugger: true,
            // Unsafe optimizations (test thoroughly)
            pure_funcs: ['console.log', 'console.debug'],
        },
        mangle: {
            // Keep class names for error reporting
            keep_classnames: false,
            // Keep function names for stack traces
            keep_fnames: false,
        },
        format: {
            // Remove comments
            comments: false,
        },
    },

    // Rollup-specific options
    rollupOptions: {
        output: {
            // Use manual chunks defined above
            manualChunks,

            // Naming patterns
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
        },

        // Tree-shake all imports
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false,
        },
    },

    // Target modern browsers for smaller bundles
    target: ['es2020', 'chrome87', 'firefox78', 'safari14', 'edge88'],

    // CSS optimizations
    cssCodeSplit: true,
    cssMinify: true,

    // Source maps for production debugging
    sourcemap: 'hidden' as const,

    // Report compressed size
    reportCompressedSize: true,

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // 500KB
};

// ============================================================================
// IMPORT OPTIMIZATION TIPS
// ============================================================================

/**
 * Tree-Shaking Best Practices:
 * 
 * 1. Use named imports instead of default imports:
 *    ❌ import lodash from 'lodash'
 *    ✅ import { debounce, throttle } from 'lodash-es'
 * 
 * 2. Import specific modules for large libraries:
 *    ❌ import { LineChart } from 'recharts'
 *    ✅ import { LineChart } from 'recharts/lib/chart/LineChart'
 * 
 * 3. Use barrel exports carefully:
 *    - Avoid re-exporting everything from index files
 *    - Import directly from the source file when possible
 * 
 * 4. Check bundle with visualizer:
 *    npm run build -- --mode analyze
 */

// ============================================================================
// LUCIDE-REACT OPTIMIZATION
// Only import icons you need
// ============================================================================

/**
 * Instead of:
 * import { User, Settings, Home, ... } from 'lucide-react'
 * 
 * Use dynamic imports for rarely-used icons:
 * const UserIcon = lazy(() => import('lucide-react').then(m => ({ default: m.User })))
 */

// ============================================================================
// EXPORTS FOR USE IN VITE CONFIG
// ============================================================================

export const viteTreeShakeConfig = {
    optimizeDeps,
    build: buildOptimizations,
};

export default viteTreeShakeConfig;
