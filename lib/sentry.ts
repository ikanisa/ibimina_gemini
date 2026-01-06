/**
 * Sentry Error Tracking Configuration
 * 
 * Initialize Sentry for production error tracking.
 * Requires VITE_SENTRY_DSN environment variable.
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry() {
    // Only initialize in production or if explicitly enabled
    if (!SENTRY_DSN) {
        if (import.meta.env.PROD) {
            console.warn('Sentry DSN not configured. Set VITE_SENTRY_DSN to enable error tracking.');
        }
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
                // Ignore network errors
                if (error.message.includes('Network request failed')) {
                    return null;
                }

                // Ignore cancelled requests
                if (error.message.includes('aborted')) {
                    return null;
                }
            }

            return event;
        },

        // Don't send errors in development unless explicitly testing
        enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_DEBUG === 'true',
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
