/**
 * Centralized error handling exports
 * 
 * This module consolidates error handling from both lib/errors and core/errors.
 * - Error classes (AppError, TimeoutError, etc.) come from core/errors
 * - Utility functions (handleError, withTimeout, etc.) come from lib/errors/ErrorHandler
 */

// Re-export error classes from core/errors for instanceof checks
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
} from '../../core/errors/AppError';

// Export error handler utilities (some may have overlapping names, prefer core/errors)
export {
  handleError,
  getUserFriendlyError, // Alias for backward compatibility
  withTimeout,
  withRetry,
  withTimeoutAndRetry,
  errorHandler,
} from './ErrorHandler';

// Export types
export type { ErrorContext, RetryOptions } from './ErrorHandler';

// Export retry utilities
export * from './retry';
