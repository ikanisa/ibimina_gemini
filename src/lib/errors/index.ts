/**
 * Centralized error handling exports
 */

export {
  AppError,
  handleError,
  getUserFriendlyMessage,
  getUserFriendlyError, // Alias for getUserFriendlyMessage
  withTimeout,
  withRetry,
  withTimeoutAndRetry,
  type ErrorContext,
} from './ErrorHandler';

export * from './retry';
