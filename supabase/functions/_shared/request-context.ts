/**
 * Request Context and Structured Logging for Edge Functions
 * Provides request ID tracing and consistent logging
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// ============================================================================
// TYPES
// ============================================================================

export interface RequestContext {
    requestId: string;
    userId: string | null;
    institutionId: string | null;
    role: string | null;
    email: string | null;
    startTime: number;
}

export interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    requestId: string;
    timestamp: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// REQUEST ID GENERATION
// ============================================================================

/**
 * Generate a unique request ID (UUID v4)
 */
export function generateRequestId(): string {
    return crypto.randomUUID();
}

/**
 * Extract request ID from headers or generate new one
 */
export function getRequestId(req: Request): string {
    return req.headers.get('x-request-id') || generateRequestId();
}

// ============================================================================
// USER CONTEXT EXTRACTION
// ============================================================================

/**
 * Decode JWT payload without verification (verification done by Supabase)
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

/**
 * Extract user context from Authorization header
 */
export async function extractUserContext(
    req: Request,
    supabase: SupabaseClient
): Promise<{ userId: string | null; institutionId: string | null; role: string | null; email: string | null }> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { userId: null, institutionId: null, role: null, email: null };
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = decodeJwtPayload(token);

    if (!payload?.sub) {
        return { userId: null, institutionId: null, role: null, email: null };
    }

    const userId = payload.sub as string;
    const email = (payload.email as string) || null;

    // Fetch profile for institution and role
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('institution_id, role')
            .eq('user_id', userId)
            .single();

        return {
            userId,
            institutionId: profile?.institution_id || null,
            role: profile?.role || null,
            email,
        };
    } catch {
        return { userId, institutionId: null, role: null, email };
    }
}

/**
 * Create full request context
 */
export async function createRequestContext(
    req: Request,
    supabase: SupabaseClient
): Promise<RequestContext> {
    const requestId = getRequestId(req);
    const userContext = await extractUserContext(req, supabase);

    return {
        requestId,
        ...userContext,
        startTime: Date.now(),
    };
}

// ============================================================================
// STRUCTURED LOGGER
// ============================================================================

export class Logger {
    private requestId: string;
    private startTime: number;
    private functionName: string;

    constructor(requestId: string, functionName: string, startTime?: number) {
        this.requestId = requestId;
        this.functionName = functionName;
        this.startTime = startTime || Date.now();
    }

    private log(level: LogEntry['level'], message: string, metadata?: Record<string, unknown>) {
        const entry: LogEntry = {
            level,
            message,
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - this.startTime,
            metadata: {
                function: this.functionName,
                ...metadata,
            },
        };

        // Structured JSON logging for Supabase logs
        const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        logFn(JSON.stringify(entry));
    }

    debug(message: string, metadata?: Record<string, unknown>) {
        this.log('debug', message, metadata);
    }

    info(message: string, metadata?: Record<string, unknown>) {
        this.log('info', message, metadata);
    }

    warn(message: string, metadata?: Record<string, unknown>) {
        this.log('warn', message, metadata);
    }

    error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>) {
        this.log('error', message, {
            ...metadata,
            error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        });
    }
}

/**
 * Create a logger instance for a request
 */
export function createLogger(context: RequestContext | string, functionName: string): Logger {
    const requestId = typeof context === 'string' ? context : context.requestId;
    const startTime = typeof context === 'string' ? Date.now() : context.startTime;
    return new Logger(requestId, functionName, startTime);
}

// ============================================================================
// SUPABASE CLIENT FACTORY
// ============================================================================

/**
 * Create Supabase client with service role (for Edge Functions)
 */
export function createServiceClient(): SupabaseClient {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase configuration');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
    });
}

/**
 * Create Supabase client with user's JWT (respects RLS)
 */
export function createUserClient(authHeader: string): SupabaseClient {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !anonKey) {
        throw new Error('Missing Supabase configuration');
    }

    return createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
        global: {
            headers: { Authorization: authHeader },
        },
    });
}
