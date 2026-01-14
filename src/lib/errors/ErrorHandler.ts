/**
 * Centralized Error Handler for Ibimina
 * Handles application-wide error logging and user-friendly error messages
 */

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ErrorContext {
  operation: string;
  component: string;
  institutionId?: string;
}


export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() { }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors
   */
  handle(error: unknown, context?: string): AppError {
    const timestamp = new Date();

    // Handle Supabase errors
    if (this.isSupabaseError(error)) {
      return this.handleSupabaseError(error, context, timestamp);
    }

    // Handle standard errors
    if (error instanceof Error) {
      return this.handleStandardError(error, context, timestamp);
    }

    // Handle unknown errors
    return this.handleUnknownError(error, context, timestamp);
  }

  private isSupabaseError(error: unknown): error is { message: string; code?: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error
    );
  }

  private handleSupabaseError(
    error: { message: string; code?: string },
    context?: string,
    timestamp?: Date
  ): AppError {
    console.error(`[Supabase Error${context ? ` - ${context}` : ''}]:`, error);

    return {
      code: error.code || 'SUPABASE_ERROR',
      message: this.getUserFriendlyMessage(error.message),
      details: error,
      timestamp: timestamp || new Date(),
    };
  }

  private handleStandardError(
    error: Error,
    context?: string,
    timestamp?: Date
  ): AppError {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);

    return {
      code: 'APP_ERROR',
      message: error.message,
      details: { stack: error.stack },
      timestamp: timestamp || new Date(),
    };
  }

  private handleUnknownError(
    error: unknown,
    context?: string,
    timestamp?: Date
  ): AppError {
    console.error(`[Unknown Error${context ? ` - ${context}` : ''}]:`, error);

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: error,
      timestamp: timestamp || new Date(),
    };
  }

  private getUserFriendlyMessage(message: string): string {
    // Map technical messages to user-friendly ones
    const messageMap: Record<string, string> = {
      'Failed to fetch': 'Network connection error. Please check your internet connection.',
      'JWT expired': 'Your session has expired. Please log in again.',
      'Invalid API key': 'Authentication error. Please contact support.',
      'Row level security': 'You do not have permission to access this resource.',
    };

    for (const [key, value] of Object.entries(messageMap)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return message;
  }

  /**
   * Log error to external service (can be extended)
   */
  async logToService(error: AppError): Promise<void> {
    // Placeholder for external logging service
    // e.g., Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      console.log('Logging to external service:', error);
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Helper function for common use
export function handleError(error: unknown, context?: string): AppError {
  return errorHandler.handle(error, context);
}

// Helper to get friendly message directly
export function getUserFriendlyMessage(errorOrMessage: unknown): string {
  if (typeof errorOrMessage === 'string') {
    return ErrorHandler.getInstance()['getUserFriendlyMessage'](errorOrMessage);
  }
  if (errorOrMessage && typeof errorOrMessage === 'object' && 'message' in errorOrMessage) {
    return ErrorHandler.getInstance()['getUserFriendlyMessage']((errorOrMessage as any).message);
  }
  return 'An unexpected error occurred';
}

// Helper for timeout
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  context?: string | { operation: string; component: string; institutionId?: string }
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const contextString = typeof context === 'string'
    ? context
    : context?.operation || 'timeout';

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    handleError(error, contextString);
    throw error;

  }
}

// Helper for retry with exponential backoff
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable (has retryable flag or is network error)
      const isRetryable =
        (error && typeof error === 'object' && 'retryable' in error && (error as any).retryable) ||
        lastError.message.includes('fetch') ||
        lastError.message.includes('network') ||
        lastError.message.includes('timeout');

      if (attempt === maxRetries || !isRetryable) {
        throw lastError;
      }

      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

// Helper combining timeout and retry
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions?: RetryOptions,
  context?: { operation: string; component: string; institutionId?: string }
): Promise<T> {
  return withRetry(
    () => withTimeout(fn(), timeoutMs, context),
    retryOptions
  );
}
