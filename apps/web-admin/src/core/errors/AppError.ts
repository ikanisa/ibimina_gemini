/**
 * Application Error Classes
 * 
 * Typed error classes for consistent error handling across the application.
 * Use these instead of generic Error for better error identification and handling.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly retryable: boolean;
    public readonly timestamp: Date;
    public readonly details?: Record<string, unknown>;

    constructor(
        message: string,
        code: string = 'APP_ERROR',
        options: {
            statusCode?: number;
            retryable?: boolean;
            details?: Record<string, unknown>;
        } = {}
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = options.statusCode ?? 500;
        this.retryable = options.retryable ?? false;
        this.timestamp = new Date();
        this.details = options.details;

        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            retryable: this.retryable,
            timestamp: this.timestamp.toISOString(),
            details: this.details,
        };
    }
}

/**
 * Validation error - for invalid input data
 */
export class ValidationError extends AppError {
    public readonly fields?: Record<string, string>;

    constructor(message: string, fields?: Record<string, string>) {
        super(message, 'VALIDATION_ERROR', { statusCode: 400 });
        this.name = 'ValidationError';
        this.fields = fields;
    }
}

/**
 * Not found error - for missing resources
 */
export class NotFoundError extends AppError {
    public readonly resourceType: string;
    public readonly resourceId?: string;

    constructor(resourceType: string, resourceId?: string) {
        const message = resourceId
            ? `${resourceType} with ID "${resourceId}" not found`
            : `${resourceType} not found`;
        super(message, 'NOT_FOUND', { statusCode: 404 });
        this.name = 'NotFoundError';
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
}

/**
 * Unauthorized error - for authentication failures
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 'UNAUTHORIZED', { statusCode: 401 });
        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden error - for authorization failures (authenticated but not allowed)
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'You do not have permission to perform this action') {
        super(message, 'FORBIDDEN', { statusCode: 403 });
        this.name = 'ForbiddenError';
    }
}

/**
 * Conflict error - for duplicate resources or state conflicts
 */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 'CONFLICT', { statusCode: 409 });
        this.name = 'ConflictError';
    }
}

/**
 * Rate limit error - for too many requests
 */
export class RateLimitError extends AppError {
    public readonly retryAfterSeconds?: number;

    constructor(retryAfterSeconds?: number) {
        super(
            retryAfterSeconds
                ? `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds`
                : 'Rate limit exceeded. Please try again later',
            'RATE_LIMIT',
            { statusCode: 429, retryable: true }
        );
        this.name = 'RateLimitError';
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

/**
 * Network error - for connectivity issues
 */
export class NetworkError extends AppError {
    constructor(message: string = 'Network connection error. Please check your internet connection.') {
        super(message, 'NETWORK_ERROR', { statusCode: 0, retryable: true });
        this.name = 'NetworkError';
    }
}

/**
 * Timeout error - for operations that took too long
 */
export class TimeoutError extends AppError {
    public readonly timeoutMs: number;

    constructor(operation: string, timeoutMs: number) {
        super(`${operation} timed out after ${timeoutMs}ms`, 'TIMEOUT', {
            statusCode: 408,
            retryable: true,
        });
        this.name = 'TimeoutError';
        this.timeoutMs = timeoutMs;
    }
}

/**
 * Supabase-specific error wrapper
 */
export class SupabaseError extends AppError {
    public readonly supabaseCode?: string;
    public readonly hint?: string;

    constructor(
        message: string,
        supabaseCode?: string,
        hint?: string
    ) {
        // Map common Supabase error codes to HTTP status codes
        let statusCode = 500;
        let retryable = false;

        if (supabaseCode) {
            if (supabaseCode.startsWith('PGRST')) {
                // PostgREST errors
                if (supabaseCode === 'PGRST116') {
                    statusCode = 404; // Not found
                } else if (supabaseCode === 'PGRST301') {
                    statusCode = 403; // RLS violation
                }
            } else if (supabaseCode === '23505') {
                statusCode = 409; // Unique violation
            } else if (supabaseCode === '23503') {
                statusCode = 400; // Foreign key violation
            } else if (supabaseCode === '42501') {
                statusCode = 403; // Insufficient privilege
            }
        }

        super(message, `SUPABASE_${supabaseCode || 'ERROR'}`, { statusCode, retryable });
        this.name = 'SupabaseError';
        this.supabaseCode = supabaseCode;
        this.hint = hint;
    }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create an AppError from an unknown error
 */
export function createAppError(error: unknown, context?: string): AppError {
    // Already an AppError
    if (error instanceof AppError) {
        return error;
    }

    // Supabase error object
    if (isSupabaseError(error)) {
        return new SupabaseError(error.message, error.code, error.hint);
    }

    // Network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return new NetworkError();
    }

    // Standard Error
    if (error instanceof Error) {
        return new AppError(
            error.message,
            'UNKNOWN_ERROR',
            { details: { originalError: error.name, context } }
        );
    }

    // Unknown error type
    return new AppError(
        'An unexpected error occurred',
        'UNKNOWN_ERROR',
        { details: { originalError: String(error), context } }
    );
}

/**
 * Type guard for Supabase errors
 */
function isSupabaseError(error: unknown): error is { message: string; code?: string; hint?: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as any).message === 'string'
    );
}

/**
 * Get a user-friendly message for any error
 */
export function getUserFriendlyMessage(error: unknown): string {
    if (error instanceof AppError) {
        // Use custom messages for known error types
        switch (error.code) {
            case 'NETWORK_ERROR':
                return 'Unable to connect. Please check your internet connection.';
            case 'TIMEOUT':
                return 'The operation took too long. Please try again.';
            case 'RATE_LIMIT':
                return 'Too many requests. Please wait a moment and try again.';
            case 'UNAUTHORIZED':
                return 'Please sign in to continue.';
            case 'FORBIDDEN':
                return 'You do not have permission to perform this action.';
            case 'NOT_FOUND':
                return 'The requested item could not be found.';
            case 'VALIDATION_ERROR':
                return error.message;
            default:
                return error.message;
        }
    }

    if (error instanceof Error) {
        // Map common error messages
        const message = error.message.toLowerCase();
        if (message.includes('jwt expired')) {
            return 'Your session has expired. Please sign in again.';
        }
        if (message.includes('network') || message.includes('fetch')) {
            return 'Unable to connect. Please check your internet connection.';
        }
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof AppError) {
        return error.retryable;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return true;
    }
    return false;
}
