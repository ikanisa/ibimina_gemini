import { createClient } from '@supabase/supabase-js';

// Use static references - Vite can only replace these at build time
// DO NOT use dynamic access like import.meta.env?.[varName] - it won't work with define!
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA as string | undefined;

const useMockData = USE_MOCK_DATA === 'true';

// Log for debugging (will show in browser console)
if (typeof window !== 'undefined') {
  console.log('[Supabase Config]', {
    url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'NOT SET',
    keySet: !!SUPABASE_ANON_KEY,
    mockMode: useMockData
  });
}

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) || useMockData;

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
      flowType: 'pkce', // Use PKCE flow for better security
      debug: import.meta.env.DEV, // Only debug in development
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

// Add global error handler for network issues
if (typeof window !== 'undefined') {
  // Intercept fetch errors at the client level
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
