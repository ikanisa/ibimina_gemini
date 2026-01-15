/**
 * Environment Configuration
 * 
 * Centralized environment variable access with validation.
 * All env vars should be accessed through this module.
 */

// Required environment variables - fail fast if missing
const REQUIRED_ENV_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

/**
 * Get a required environment variable
 * @throws Error if the variable is not set
 */
export function requireEnv(name: string): string {
    const v = (import.meta as any).env?.[name];
    if (!v || typeof v !== 'string' || !v.trim()) {
        throw new Error(`Missing required env: ${name}`);
    }
    return v.trim();
}

/**
 * Get an optional environment variable with fallback
 */
export function getOptionalEnv(name: string, fallback = ''): string {
    const v = (import.meta as any).env?.[name];
    return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

/**
 * Validate that a URL is a valid Supabase URL
 */
function isValidSupabaseUrl(url: string | undefined): boolean {
    return !!(
        url &&
        url.startsWith('https://') &&
        url.includes('.supabase.co') &&
        !url.includes('your-project') &&
        !url.includes('placeholder')
    );
}

/**
 * Validate that a key looks like a valid Supabase anon key
 */
function isValidSupabaseKey(key: string | undefined): boolean {
    return !!(
        key &&
        key.length > 100 && // JWT tokens are typically 200+ chars
        !key.includes('your-') &&
        !key.includes('placeholder')
    );
}

// Raw env values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA as string | undefined;

/**
 * Structured environment configuration
 */
export const env = {
    supabase: {
        url: SUPABASE_URL || 'https://placeholder.supabase.co',
        anonKey: SUPABASE_ANON_KEY || 'placeholder',
        isConfigured: isValidSupabaseUrl(SUPABASE_URL) && isValidSupabaseKey(SUPABASE_ANON_KEY),
    },
    sentry: {
        dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
        environment: import.meta.env.MODE,
    },
    app: {
        mode: import.meta.env.MODE as 'development' | 'production' | 'test',
        isProd: import.meta.env.MODE === 'production',
        isDev: import.meta.env.DEV === true,
        useMockData: USE_MOCK_DATA === 'true',
    },
} as const;

// Log configuration in browser (non-production only)
if (typeof window !== 'undefined' && env.app.isDev) {
    console.debug('[Env Config]', {
        supabaseUrl: env.supabase.url ? `${env.supabase.url.substring(0, 35)}...` : 'NOT SET',
        supabaseConfigured: env.supabase.isConfigured,
        mode: env.app.mode,
        mockData: env.app.useMockData,
    });
}
