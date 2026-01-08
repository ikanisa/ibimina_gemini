import { createClient } from '@supabase/supabase-js';
import { requireEnv, getOptionalEnv } from './env';

const useMockData = getOptionalEnv('VITE_USE_MOCK_DATA') === 'true';

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  if (!useMockData) {
    supabaseUrl = requireEnv('VITE_SUPABASE_URL');
    supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY');
  }
} catch (error) {
  console.error('Supabase Configuration Error:', error);
  // We allow the app to continue so the ErrorBoundary can show a nice message
  // instead of crashing the entire script execution immediately.
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

