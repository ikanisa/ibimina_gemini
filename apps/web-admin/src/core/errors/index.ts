/**
 * Core Errors Module
 * 
 * Provides typed error classes and error handling utilities.
 */

// Typed error classes
export {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    RateLimitError,
    NetworkError,
    TimeoutError,
    SupabaseError,
    createAppError,
    getUserFriendlyMessage,
    isRetryableError,
} from './AppError';

// Legacy error handler (for backward compatibility)
export {
    handleError,
    getUserFriendlyError,
    withTimeout,
    withRetry,
    withTimeoutAndRetry,
    type ErrorContext,
} from '../../lib/errors/ErrorHandler';

export type { RetryOptions } from '../../lib/errors/ErrorHandler';
