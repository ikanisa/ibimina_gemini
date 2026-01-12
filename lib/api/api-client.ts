/**
 * API Client with Timeout and Error Handling
 * Centralized HTTP client for all API requests with automatic timeout,
 * retry logic, and consistent error handling.
 */

import { supabase } from '../supabase';
import { captureError } from '../sentry';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly status?: number,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class TimeoutError extends ApiError {
    constructor(message = 'Request timed out') {
        super(message, 'TIMEOUT', 408);
        this.name = 'TimeoutError';
    }
}

export class NetworkError extends ApiError {
    constructor(message = 'Network error occurred') {
        super(message, 'NETWORK_ERROR', 0);
        this.name = 'NetworkError';
    }
}

export class AuthError extends ApiError {
    constructor(message = 'Authentication required') {
        super(message, 'AUTH_ERROR', 401);
        this.name = 'AuthError';
    }
}

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
    // Authentication
    AUTH_001: 'Invalid credentials',
    AUTH_002: 'Token expired',
    AUTH_003: 'Account suspended',
    AUTH_004: 'Email not verified',
    AUTH_005: 'Session expired',

    // Transactions
    TXN_001: 'Insufficient funds',
    TXN_002: 'Transaction limit exceeded',
    TXN_003: 'Invalid transaction type',
    TXN_004: 'Transaction not found',
    TXN_005: 'Transaction already processed',

    // Members
    MBR_001: 'Member not found',
    MBR_002: 'Duplicate phone number',
    MBR_003: 'Invalid member status',

    // Groups
    GRP_001: 'Group not found',
    GRP_002: 'Group is closed',
    GRP_003: 'Member already in group',

    // General
    GEN_001: 'Internal server error',
    GEN_002: 'Invalid request',
    GEN_003: 'Resource not found',
    GEN_004: 'Permission denied',
    GEN_005: 'Rate limit exceeded',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a promise that rejects after specified timeout
 */
function createTimeoutPromise<T>(ms: number): Promise<T> {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new TimeoutError()), ms);
    });
}

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
    if (error instanceof TimeoutError) return true;
    if (error instanceof NetworkError) return true;
    if (error instanceof ApiError && error.status && error.status >= 500) return true;
    return false;
}

// ============================================================================
// API CLIENT
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        hasMore?: boolean;
    };
}

export interface RequestOptions {
    timeout?: number;
    retries?: number;
    signal?: AbortSignal;
}

/**
 * Wraps a promise with timeout
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
    return Promise.race([
        promise,
        createTimeoutPromise<T>(timeoutMs),
    ]);
}

/**
 * Wraps a promise with timeout and retry logic
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RequestOptions = {}
): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await withTimeout(fn(), timeout);
        } catch (error) {
            lastError = error;

            // Don't retry on last attempt or non-retryable errors
            if (attempt === retries || !isRetryableError(error)) {
                break;
            }

            // Exponential backoff
            await delay(RETRY_DELAY_MS * Math.pow(2, attempt));
        }
    }

    throw lastError;
}

/**
 * Main API client for Supabase queries with timeout and error handling
 */
export const apiClient = {
    /**
     * Execute a Supabase query with timeout and retry
     */
    async query<T>(
        queryFn: () => Promise<{ data: T | null; error: { message: string; code?: string } | null }>,
        options?: RequestOptions
    ): Promise<T> {
        try {
            const result = await withRetry(async () => {
                const response = await queryFn();

                if (response.error) {
                    throw new ApiError(
                        response.error.message,
                        response.error.code || 'UNKNOWN',
                        400
                    );
                }

                if (response.data === null) {
                    throw new ApiError('No data returned', 'NO_DATA', 404);
                }

                return response.data;
            }, options);

            return result;
        } catch (error) {
            // Log to Sentry in production
            if (import.meta.env.PROD) {
                captureError(error as Error, {
                    context: 'apiClient.query',
                });
            }
            throw error;
        }
    },

    /**
     * Execute a mutation (insert/update/delete) with timeout
     */
    async mutate<T>(
        mutateFn: () => Promise<{ data: T | null; error: { message: string; code?: string } | null }>,
        options?: RequestOptions
    ): Promise<T> {
        try {
            const result = await withTimeout(async () => {
                const response = await mutateFn();

                if (response.error) {
                    throw new ApiError(
                        response.error.message,
                        response.error.code || 'UNKNOWN',
                        400
                    );
                }

                return response.data as T;
            }, options?.timeout ?? DEFAULT_TIMEOUT_MS);

            return result;
        } catch (error) {
            if (import.meta.env.PROD) {
                captureError(error as Error, {
                    context: 'apiClient.mutate',
                });
            }
            throw error;
        }
    },

    /**
     * Get current authenticated user's session
     */
    async getSession() {
        const { data, error } = await withTimeout(
            supabase.auth.getSession(),
            5000
        );

        if (error) {
            throw new AuthError(error.message);
        }

        return data.session;
    },

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            const session = await this.getSession();
            return !!session;
        } catch {
            return false;
        }
    },
};

/**
 * Helper to create paginated response
 */
export function createPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): ApiResponse<T[]> {
    return {
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            hasMore: page * limit < total,
        },
    };
}

/**
 * Helper to create error response
 */
export function createErrorResponse(
    code: keyof typeof ERROR_CODES,
    details?: unknown
): ApiResponse<never> {
    return {
        success: false,
        error: {
            code,
            message: ERROR_CODES[code],
            details,
        },
    };
}

export default apiClient;
