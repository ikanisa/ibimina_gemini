/**
 * Core Errors - Re-export from lib/errors
 * 
 * This module provides a stable import path for error handling utilities.
 * The actual implementation remains in lib/errors for backward compatibility.
 */

export {
    AppError,
    handleError,
    getUserFriendlyMessage,
    getUserFriendlyError,
    withTimeout,
    withRetry,
    withTimeoutAndRetry,
    type ErrorContext,
} from '../../lib/errors';

// Re-export RetryOptions from ErrorHandler directly
export type { RetryOptions } from '../../lib/errors/ErrorHandler';
