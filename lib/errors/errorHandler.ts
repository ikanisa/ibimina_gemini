/**
 * Centralized Error Handling
 * 
 * Provides consistent error handling across the application
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle Supabase errors and convert to user-friendly messages
 */
export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      originalError: error.originalError
    };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; code?: string; statusCode?: number };
    
    // Map common Supabase error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'PGRST116': 'The requested record was not found.',
      '23505': 'This record already exists.',
      '23503': 'Cannot delete this record because it is referenced by other records.',
      '42501': 'You do not have permission to perform this action.',
      '42P01': 'Database table not found. Please contact support.',
    };

    const code = supabaseError.code || 'UNKNOWN';
    const message = errorMessages[code] || supabaseError.message || 'An unexpected error occurred.';

    return {
      message,
      code,
      statusCode: supabaseError.statusCode,
      originalError: error
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    originalError: error
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  const appError = handleSupabaseError(error);
  return appError.message;
}

/**
 * Log error for debugging (in production, send to error tracking service)
 */
export function logError(error: unknown, context?: string) {
  const appError = handleSupabaseError(error);
  
  console.error('Error:', {
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    context,
    originalError: appError.originalError
  });

  // In production, send to error tracking service (e.g., Sentry)
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, { extra: { context } });
  // }
}

