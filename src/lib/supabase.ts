import { createClient } from '@supabase/supabase-js';

// Use static references - Vite can only replace these at build time
// DO NOT use dynamic access like import.meta.env?.[varName] - it won't work with define!
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA as string | undefined;

const useMockData = USE_MOCK_DATA === 'true';

// Validate that env vars are real values, not placeholders
const isValidUrl = SUPABASE_URL &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co') &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_URL.includes('placeholder');

const isValidKey = SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY.length > 100 && // JWT tokens are typically 200+ chars
  !SUPABASE_ANON_KEY.includes('your-') &&
  !SUPABASE_ANON_KEY.includes('placeholder');

// Log for debugging (will show in browser console)
if (typeof window !== 'undefined') {
  const logLevel = import.meta.env.DEV ? 'debug' : 'info';
  const logFn = logLevel === 'debug' ? console.debug : console.info;

  logFn('[Supabase Config]', {
    url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 35)}...` : 'NOT SET',
    urlValid: isValidUrl,
    keySet: !!SUPABASE_ANON_KEY,
    keyValid: isValidKey,
    keyLength: SUPABASE_ANON_KEY?.length || 0,
    mockMode: useMockData,
    mode: import.meta.env.MODE,
  });

  // Warn loudly if configuration is invalid
  if (!isValidUrl || !isValidKey) {
    console.warn(
      '%c[Supabase] Configuration Issue Detected',
      'background: #ff6b6b; color: white; padding: 2px 6px; border-radius: 3px;',
      '\n\nURL:', SUPABASE_URL || 'NOT SET',
      '\nKey Length:', SUPABASE_ANON_KEY?.length || 0,
      '\n\nCheck .env.local file or Cloudflare Pages environment variables.'
    );
  }
}

export const isSupabaseConfigured = (isValidUrl && isValidKey) || useMockData;

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
