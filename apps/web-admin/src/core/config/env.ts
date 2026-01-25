/**
 * Environment Configuration
 * 
 * Centralized environment variable access with validation.
 * All env vars should be accessed through this module.
 */

// ============================================================================
// Environment Variable Accessors
// ============================================================================

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

// ============================================================================
// Validation Helpers
// ============================================================================

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

// ============================================================================
// Raw Environment Values
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA as string | undefined;

// ============================================================================
// Structured Environment Configuration
// ============================================================================

/**
 * Structured environment configuration object
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
        name: 'Ibimina',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        mode: import.meta.env.MODE as 'development' | 'production' | 'test',
        isProd: import.meta.env.MODE === 'production',
        isDev: import.meta.env.DEV === true,
        useMockData: USE_MOCK_DATA === 'true',
        baseUrl: import.meta.env.BASE_URL || '/',
    },
    features: {
        /** Enable SMS gateway integration */
        smsGateway: getOptionalEnv('VITE_FEATURE_SMS_GATEWAY', 'true') === 'true',
        /** Enable MFA for authentication */
        mfa: getOptionalEnv('VITE_FEATURE_MFA', 'true') === 'true',
        /** Enable realtime updates */
        realtime: getOptionalEnv('VITE_FEATURE_REALTIME', 'true') === 'true',
    },
} as const;

// ============================================================================
// Validation Report
// ============================================================================

export interface EnvValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validate all environment configuration
 * Call this at app startup to catch configuration issues early
 */
export function validateEnv(): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required: Supabase configuration
    if (!env.supabase.isConfigured && !env.app.useMockData) {
        errors.push('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    // Production checks
    if (env.app.isProd) {
        // Mock data should never be enabled in production
        if (env.app.useMockData) {
            errors.push('CRITICAL: VITE_USE_MOCK_DATA=true in production! This bypasses authentication.');
        }

        // Sentry should be configured in production
        if (!env.sentry.dsn) {
            warnings.push('Sentry DSN not configured. Error tracking will be disabled.');
        }
    }

    // Development warnings
    if (env.app.isDev) {
        if (!env.supabase.isConfigured) {
            warnings.push('Supabase not configured. Using placeholder values.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Log environment configuration (safe for console)
 */
export function logEnvConfig(): void {
    if (typeof window === 'undefined') return;

    const validation = validateEnv();

    console.group('[Environment Configuration]');
    console.log('Mode:', env.app.mode);
    console.log('Supabase:', env.supabase.isConfigured ? '✓ Configured' : '✗ Not configured');
    console.log('Sentry:', env.sentry.dsn ? '✓ Configured' : '○ Not configured');
    console.log('Features:', {
        smsGateway: env.features.smsGateway,
        mfa: env.features.mfa,
        realtime: env.features.realtime,
    });

    if (validation.errors.length > 0) {
        console.error('Errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
        console.warn('Warnings:', validation.warnings);
    }
    console.groupEnd();
}

// Auto-log in development
if (typeof window !== 'undefined' && env.app.isDev) {
    logEnvConfig();
}

// ============================================================================
// Type Exports
// ============================================================================

export type Env = typeof env;
export type AppMode = typeof env.app.mode;
