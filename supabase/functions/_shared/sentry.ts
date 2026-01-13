/**
 * Sentry Error Tracking for Supabase Edge Functions
 * 
 * Note: Sentry for Deno/Edge Functions requires @sentry/deno package
 * For now, we'll use a simple error logging approach that can be
 * integrated with Sentry via webhook or API
 */

interface ErrorContext {
  functionName: string;
  userId?: string;
  institutionId?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Log error to console (can be forwarded to Sentry via webhook)
 */
export function logError(error: unknown, context: ErrorContext) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(JSON.stringify({
    level: 'error',
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
    // This can be forwarded to Sentry via webhook
    sentry: {
      level: 'error',
      tags: {
        function: context.functionName,
        environment: Deno.env.get('ENVIRONMENT') || 'production',
      },
      user: context.userId ? { id: context.userId } : undefined,
      extra: {
        institution_id: context.institutionId,
        request_id: context.requestId,
      },
    },
  }));
}

/**
 * Capture exception (for Sentry integration)
 */
export function captureException(error: unknown, context: ErrorContext) {
  logError(error, context);

  // TODO: Integrate with Sentry Edge Functions SDK when available
  // For now, errors are logged and can be forwarded via webhook
  // See: https://docs.sentry.io/platforms/javascript/guides/deno/
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error', context: ErrorContext) {
  console.log(JSON.stringify({
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Set user context for error tracking
 */
export function setUser(userId: string, email?: string, institutionId?: string) {
  // Store in context for error logging
  // This can be used when logging errors
  return {
    userId,
    email,
    institutionId,
  };
}
