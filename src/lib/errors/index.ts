/**
 * Centralized error handling exports
 */

export {
  handleError,
  getUserFriendlyMessage,
  getUserFriendlyError, // Alias for getUserFriendlyMessage
  withTimeout,
  withRetry,
  withTimeoutAndRetry,
} from './ErrorHandler';

export type { AppError, ErrorContext } from './ErrorHandler';

export * from './retry';
