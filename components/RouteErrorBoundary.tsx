/**
 * Route Error Boundary
 * Wraps routes with error handling for React Router
 */

import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import * as Sentry from '@sentry/react';

// ============================================================================
// ERROR FALLBACK COMPONENT
// ============================================================================

interface RouteErrorFallbackProps extends FallbackProps {
    routeName?: string;
}

const RouteErrorFallback: React.FC<RouteErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
    routeName,
}) => {
    const isNetworkError = error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('fetch');

    const isAuthError = error.message?.toLowerCase().includes('auth') ||
        error.message?.toLowerCase().includes('unauthorized');

    const handleGoHome = () => {
        window.location.href = '/';
    };

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {/* Error Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                    <AlertTriangle size={32} className="text-red-600" />
                </div>

                {/* Error Title */}
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {isNetworkError
                        ? 'Connection Error'
                        : isAuthError
                            ? 'Authentication Error'
                            : 'Something went wrong'}
                </h2>

                {/* Error Message */}
                <p className="text-slate-600 mb-6">
                    {isNetworkError
                        ? 'Please check your internet connection and try again.'
                        : isAuthError
                            ? 'Your session may have expired. Please sign in again.'
                            : routeName
                                ? `An error occurred while loading ${routeName}.`
                                : 'An unexpected error occurred. Please try again.'}
                </p>

                {/* Error Details (dev only) */}
                {import.meta.env.DEV && error.message && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                        <p className="text-xs font-mono text-red-700 break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={resetErrorBoundary}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>

                    <button
                        onClick={handleGoBack}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>

                    <button
                        onClick={handleGoHome}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                        <Home size={18} />
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// ROUTE ERROR BOUNDARY
// ============================================================================

interface RouteErrorBoundaryProps {
    children: React.ReactNode;
    routeName?: string;
    onReset?: () => void;
}

export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({
    children,
    routeName,
    onReset,
}) => {
    const handleError = (error: Error, info: React.ErrorInfo) => {
        console.error(`[RouteError] ${routeName || 'Unknown route'}:`, error, info);

        // Report to Sentry in production
        if (import.meta.env.PROD) {
            Sentry.captureException(error, {
                tags: {
                    route: routeName || 'unknown',
                    errorType: 'route_error',
                },
                extra: {
                    componentStack: info.componentStack,
                },
            });
        }
    };

    return (
        <ErrorBoundary
            FallbackComponent={(props) => (
                <RouteErrorFallback {...props} routeName={routeName} />
            )}
            onError={handleError}
            onReset={onReset}
        >
            {children}
        </ErrorBoundary>
    );
};

// ============================================================================
// HOC FOR WRAPPING LAZY ROUTES
// ============================================================================

export function withRouteErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    routeName: string
): React.FC<P> {
    const WrappedComponent: React.FC<P> = (props) => (
        <RouteErrorBoundary routeName={routeName}>
            <Component {...props} />
        </RouteErrorBoundary>
    );

    WrappedComponent.displayName = `withRouteErrorBoundary(${routeName})`;
    return WrappedComponent;
}

export default RouteErrorBoundary;
