/**
 * Sentry Error Tracking Configuration
 * 
 * Initialize Sentry for production error tracking.
 * Requires VITE_SENTRY_DSN environment variable.
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry() {
    // Only initialize if DSN is configured (Sentry is optional)
    if (!SENTRY_DSN) {
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,

        // Environment configuration
        environment: import.meta.env.MODE,

        // Release tracking (set during build)
        release: import.meta.env.VITE_APP_VERSION || 'development',

        // Integration configuration
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                // Capture 10% of sessions for replay
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        // Performance monitoring
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev

        // Session replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% when error occurs

        // Error filtering
        beforeSend(event, hint) {
            // Filter out known non-critical errors
            const error = hint.originalException;

            if (error instanceof Error) {
                // Ignore network errors (handled by retry logic)
                if (
                    error.message.includes('Network request failed') ||
                    error.message.includes('Failed to fetch') ||
                    error.message.includes('NetworkError')
                ) {
                    return null;
                }

                // Ignore cancelled requests
                if (
                    error.message.includes('aborted') ||
                    error.message.includes('cancelled')
                ) {
                    return null;
                }

                // Ignore timeout errors (handled by timeout logic)
                if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
                    return null;
                }

                // Ignore Supabase auth errors (handled by app)
                if (error.message.includes('Invalid login credentials')) {
                    return null;
                }
            }

            // Add additional context
            if (event.contexts) {
                event.contexts.runtime = {
                    name: 'browser',
                    version: navigator.userAgent,
                };
            }

            // Add tags for better filtering
            event.tags = {
                ...event.tags,
                component: event.tags?.component || 'unknown',
                environment: import.meta.env.MODE,
            };

            return event;
        },

        // Don't send errors in development unless explicitly testing
        enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_DEBUG === 'true',

        // Source maps configuration
        // Source maps are uploaded separately via Sentry CLI during build
        // See: https://docs.sentry.io/platforms/javascript/sourcemaps/
    });

    // Set initial tags
    Sentry.setTag('app', 'sacco-admin-portal');
    Sentry.setTag('version', import.meta.env.VITE_APP_VERSION || 'development');
}

/**
 * Capture message (for logging important events)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
    if (context) {
        Sentry.withScope(scope => {
            Object.entries(context).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
            Sentry.captureMessage(message, level);
        });
    } else {
        Sentry.captureMessage(message, level);
    }
}


/**
 * Set additional context for errors
 */
export function setContext(key: string, context: Record<string, unknown>) {
    Sentry.setContext(key, context);
}

/**
 * Set tag for filtering
 */
export function setTag(key: string, value: string) {
    Sentry.setTag(key, value);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
    return Sentry.startInactiveSpan({
        name,
        op,
        forceTransaction: true,
    });
}

// Enhanced error boundary for React
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Manual error capture
export function captureError(error: unknown, context?: Record<string, unknown>) {
    if (context) {
        Sentry.withScope(scope => {
            Object.entries(context).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
            Sentry.captureException(error);
        });
    } else {
        Sentry.captureException(error);
    }
}

// Set user context
export function setUser(user: { id: string; email?: string; institutionId?: string }) {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        institution_id: user.institutionId,
    });
}

// Clear user on logout
export function clearUser() {
    Sentry.setUser(null);
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

export default Sentry;
