/**
 * Centralized Error Handling Utility
 * 
 * Provides consistent error handling across the application
 * with timeout support, retry logic, and Sentry integration
 */

import { captureError } from '../sentry';

export interface ErrorContext {
  operation?: string;
  component?: string;
  userId?: string;
  institutionId?: string;
  metadata?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public context?: ErrorContext,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timed out', context?: ErrorContext) {
    super(message, 'TIMEOUT', 408, context, true);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error', context?: ErrorContext) {
    super(message, 'NETWORK_ERROR', 0, context, true);
    this.name = 'NetworkError';
  }
}

/**
 * Wraps an async function with timeout and error handling
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  context?: ErrorContext
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, context));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (error instanceof TimeoutError) {
      captureError(error, {
        ...context,
        timeout: timeoutMs,
      });
    }
    throw error;
  }
}

/**
 * Retries a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    retryable?: (error: unknown) => boolean;
    context?: ErrorContext;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    retryable = (error) => error instanceof AppError && error.retryable,
    context,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable or we've exhausted retries
      if (!retryable(error) || attempt === maxRetries) {
        break;
      }

      // Log retry attempt
      if (context) {
        captureError(error, {
          ...context,
          retryAttempt: attempt + 1,
          maxRetries,
        });
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Wraps a function with timeout and retry logic
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    maxRetries?: number;
    context?: ErrorContext;
  } = {}
): Promise<T> {
  const { timeout = 30000, maxRetries = 3, context } = options;

  return withRetry(
    () => withTimeout(fn(), timeout, context),
    {
      maxRetries,
      context,
    }
  );
}

/**
 * Handles errors consistently and reports to Sentry
 */
export function handleError(error: unknown, context?: ErrorContext): AppError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    // Check for network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    ) {
      appError = new NetworkError('Network request failed', context);
    } else {
      appError = new AppError(error.message, 'UNKNOWN_ERROR', undefined, context);
    }
  } else {
    appError = new AppError(
      'An unknown error occurred',
      'UNKNOWN_ERROR',
      undefined,
      context
    );
  }

  // Report to Sentry
  captureError(appError, {
    ...context,
    originalError: error,
  });

  return appError;
}

/**
 * Creates a user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case 'TIMEOUT':
        return 'The request took too long. Please try again.';
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection.';
      case 'UNAUTHORIZED':
        return 'You are not authorized to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'VALIDATION_ERROR':
        return error.message || 'Invalid input. Please check your data.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
