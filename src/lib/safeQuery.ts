import { PostgrestError, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Standardized error codes for better handling
 */
export enum AppErrorCode {
    RLS_VIOLATION = 'PGRST116',
    RATE_LIMIT = '429',
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT = 'TIMEOUT',
    UNKNOWN = 'UNKNOWN',
}

interface SafeQueryOptions {
    /**
     * Custom error message to override default
     */
    errorMessage?: string;
    /**
     * Whether to show a toast notification on error (default: true)
     */
    showToast?: boolean;
    /**
     * Whether to retry on transient errors (default: true)
     */
    retry?: boolean;
}

/**
 * Universal wrapper for Supabase queries.
 * automatically handles RLS, Network, Timeout, and Rate Limit errors.
 */
export async function safeQuery<T>(
    queryPromise: PromiseLike<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
    options: SafeQueryOptions = {}
): Promise<{ data: T | null; error: PostgrestError | null }> {
    const {
        errorMessage = 'Something went wrong',
        showToast = true,
        retry = true
    } = options;

    try {
        const response = await queryPromise;

        if (response.error) {
            handleSupabaseError(response.error, errorMessage, showToast);
            return { data: null, error: response.error };
        }

        return { data: response.data as T, error: null };
    } catch (err) {
        // Handle unexpected exceptions (network, timeout, code errors)
        const error = normalizeError(err);

        if (showToast) {
            toast.error('An unexpected error occurred', {
                description: error.message
            });
        }

        // Convert to PostgrestError shape for consistency
        const pgError: PostgrestError = {
            message: error.message,
            details: error.stack || '',
            hint: '',
            code: AppErrorCode.UNKNOWN
        };

        return { data: null, error: pgError };
    }
}

/**
 * Centralized error handler logic
 */
function handleSupabaseError(error: PostgrestError, message: string, showToast: boolean) {
    // 1. RLS Violation (Row Security)
    if (error.code === AppErrorCode.RLS_VIOLATION) {
        if (showToast) {
            toast.error('Permission Denied', {
                description: "You don't have access to this resource."
            });
        }
        return;
    }

    // 2. Rate Limit (Too Many Requests)
    if (error.code === AppErrorCode.RATE_LIMIT) {
        if (showToast) {
            toast.error('Too many requests', {
                description: "Please wait a moment before trying again."
            });
        }
        return;
    }

    // 3. Foreign Key Constraint
    if (error.code === '23503') {
        if (showToast) {
            toast.error('Operation Failed', {
                description: "This record is referenced by other data and cannot be modified."
            });
        }
        return;
    }

    // 4. Unique Violation
    if (error.code === '23505') {
        if (showToast) {
            toast.error('Already Exists', {
                description: "This record already exists."
            });
        }
        return;
    }

    // Fallback for other errors
    if (showToast) {
        toast.error(message, {
            description: import.meta.env.DEV ? error.message : 'Please try again later.'
        });
    }

    // Log to console in dev
    if (import.meta.env.DEV) {
        console.error('[Supabase Query Error]', error);
    }
}

function normalizeError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(String(error));
}
