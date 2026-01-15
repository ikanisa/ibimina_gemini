
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

export default defineConfig(({ mode }) => {
  // Load .env files for local development
  // IMPORTANT: loadEnv prefix '' loads ALL env vars, then we filter for VITE_
  // This ensures .env.local is properly read
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const isProduction = mode === 'production';

  // Debug: Log env vars at build time (visible in Cloudflare build logs)
  // Priority: process.env (Cloudflare) > loadEnv (.env.local)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  console.log('[Vite Build] Environment:', mode);
  console.log('[Vite Build] CWD:', process.cwd());
  console.log('[Vite Build] process.env.VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('[Vite Build] loadEnv VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('[Vite Build] Final VITE_SUPABASE_URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'EMPTY');
  console.log('[Vite Build] VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET (' + supabaseKey.length + ' chars)' : 'NOT SET');

  // Warn if env vars are missing in production build
  if (isProduction && (!supabaseUrl || !supabaseKey)) {
    console.error('⚠️  WARNING: Supabase env vars missing in production build!');
    console.error('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages settings.');
  }

  // CRITICAL: For Cloudflare Pages, we need to explicitly define these
  // because Cloudflare's build environment doesn't always pass VITE_* to process.env correctly
  // Vite's loadEnv should pick them up, but we double-check with process.env as fallback
  const envDefines: Record<string, string> = {};

  // Only define if we have actual values - don't override with empty strings
  if (supabaseUrl) {
    envDefines['import.meta.env.VITE_SUPABASE_URL'] = JSON.stringify(supabaseUrl);
  }
  if (supabaseKey) {
    envDefines['import.meta.env.VITE_SUPABASE_ANON_KEY'] = JSON.stringify(supabaseKey);
  }

  console.log('[Vite Build] Env defines count:', Object.keys(envDefines).length);

  const plugins = [
    react(),
    VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Ibimina - SACCO+ Admin',
          short_name: 'Ibimina',
          description: 'Group savings and loans management for SACCOs and MFIs',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'icons/icon-152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icons/icon-256.png',
              sizes: '256x256',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icons/icon-384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          runtimeCaching: [
            {
              // Use NetworkFirst with shorter cache for auth endpoints (always fresh)
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*\/auth\/v1\//i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-auth-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 // 1 minute - auth should be fresh
                },
                networkTimeoutSeconds: 5, // Fall back to cache after 5s
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Use NetworkFirst with shorter cache for REST API (prevent stale data)
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*\/rest\/v1\//i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5 // 5 minutes - shorter cache to prevent stale data
                },
                networkTimeoutSeconds: 10, // Fall back to cache after 10s if network slow
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Other Supabase endpoints
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 10 // 10 minutes - reduced from 24 hours
                },
                networkTimeoutSeconds: 10,
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ],
          // Optimize service worker size
          skipWaiting: true,
          clientsClaim: true,
          // Clean up old caches
          cleanupOutdatedCaches: true,
          // Clear caches on new service worker activation
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      }),
      // Brotli compression for production
      compression({
        algorithm: 'brotliCompress',
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024, // Only compress files > 1KB
      }),
  ];

  if (!isProduction) {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      })
    );
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    // Load env from process.env for Cloudflare Pages compatibility
    envPrefix: 'VITE_',
    plugins,
    // Explicitly define env vars for Cloudflare Pages compatibility
    define: envDefines,
    build: {
      // Target modern browsers for smaller bundles
      target: 'es2020',

      // Chunk splitting strategy
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['zod'],
          }
        }
      },

      // Enable minification with console.log removal in production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        format: {
          comments: false,
        },
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 1000,

      // Disable sourcemaps in production for smaller bundles
      sourcemap: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', '@supabase/supabase-js'],
      exclude: [],
    },
  };
});
