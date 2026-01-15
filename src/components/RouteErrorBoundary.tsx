/**
 * Route Error Boundary
 * Wraps routes with error handling for React Router
 */

import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import * as Sentry from '@sentry/react';
import { ErrorPage } from './errors/ErrorPage';

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

    const title = isNetworkError
        ? 'Connection Error'
        : isAuthError
            ? 'Authentication Error'
            : 'Something went wrong';

    const message = isNetworkError
        ? 'Please check your internet connection and try again.'
        : isAuthError
            ? 'Your session may have expired. Please sign in again.'
            : routeName
                ? `An error occurred while loading ${routeName}.`
                : 'An unexpected error occurred. Please try again.';

    return (
        <ErrorPage
            error={error}
            resetErrorBoundary={resetErrorBoundary}
            title={title}
            message={message}
            showGoBack={true}
            showGoHome={true}
        />
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
        // Detect if this is a chunk loading error
        const isChunkError =
            error.message?.toLowerCase().includes('loading chunk') ||
            error.message?.toLowerCase().includes('loading css chunk') ||
            error.message?.toLowerCase().includes('failed to fetch dynamically imported module') ||
            error.message?.toLowerCase().includes('importing a module script failed') ||
            error.name === 'ChunkLoadError';

        const isNetworkError =
            error.message?.toLowerCase().includes('network') ||
            error.message?.toLowerCase().includes('fetch');

        // Enhanced logging with error classification
        console.error(
            `[RouteError] ${routeName || 'Unknown route'}:`,
            {
                errorName: error.name,
                errorMessage: error.message,
                errorType: isChunkError ? 'chunk_load' : isNetworkError ? 'network' : 'runtime',
                stack: error.stack,
            }
        );
        console.error('[RouteError] Component Stack:', info.componentStack);

        // Report to Sentry in production with enhanced context
        if (import.meta.env.PROD) {
            Sentry.captureException(error, {
                tags: {
                    route: routeName || 'unknown',
                    errorType: isChunkError ? 'chunk_load_error' : isNetworkError ? 'network_error' : 'route_error',
                },
                extra: {
                    componentStack: info.componentStack,
                    isChunkError,
                    isNetworkError,
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
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
