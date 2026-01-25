/**
 * Supabase Client Configuration
 * 
 * Centralized Supabase client instance for the application.
 * Import from here instead of creating new clients.
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Whether Supabase is properly configured
 */
export const isSupabaseConfigured = env.supabase.isConfigured || env.app.useMockData;

/**
 * Main Supabase client instance
 */
export const supabase = createClient(
    env.supabase.url,
    env.supabase.anonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            storageKey: 'sb-auth-token',
            flowType: 'pkce', // Use PKCE flow for better security
            debug: env.app.isDev, // Only debug in development
        },
        global: {
            headers: {
                'x-client-info': 'sacco-admin-portal@1.0.0',
            },
        },
        db: {
            schema: 'public',
        },
        realtime: {
            params: {
                eventsPerSecond: 10, // Limit realtime events
            },
        },
    }
);

// Log configuration warnings
if (typeof window !== 'undefined') {
    if (!env.supabase.isConfigured && !env.app.useMockData) {
        console.warn(
            '%c[Supabase] Configuration Issue Detected',
            'background: #ff6b6b; color: white; padding: 2px 6px; border-radius: 3px;',
            '\n\nCheck .env.local file or Cloudflare Pages environment variables.'
        );
    }
}

// Add global error handler for network issues
if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        try {
            const response = await originalFetch(...args);
            return response;
        } catch (error) {
            // Log network errors for debugging
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('[Network Error]', error);
            }
            throw error;
        }
    };
}
