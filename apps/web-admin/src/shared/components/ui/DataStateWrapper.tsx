/**
 * DataStateWrapper - Unified UX State Handler
 * 
 * Provides consistent loading, error, empty, and timeout states
 * for data-driven components. Eliminates infinite spinners.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface DataStateWrapperProps<T> {
    /** Data to display when loaded */
    data: T | null | undefined;
    /** Whether data is currently loading */
    loading: boolean;
    /** Error message if fetch failed */
    error?: string | null;
    /** Callback to retry failed fetch */
    onRetry?: () => void;
    /** Timeout in ms before showing timeout error (default 15000) */
    timeoutMs?: number;
    /** Check if data is empty (default: array length check) */
    isEmpty?: (data: T) => boolean;
    /** Custom loading component */
    loadingComponent?: React.ReactNode;
    /** Empty state config */
    emptyState?: {
        title: string;
        description?: string;
        action?: React.ReactNode;
    };
    /** Render children when data is ready */
    children: (data: T) => React.ReactNode;
    /** Additional class name */
    className?: string;
}

interface TimeoutState {
    isTimedOut: boolean;
    startTime: number | null;
}

export function DataStateWrapper<T>({
    data,
    loading,
    error,
    onRetry,
    timeoutMs = 15000,
    isEmpty,
    loadingComponent,
    emptyState,
    children,
    className = '',
}: DataStateWrapperProps<T>) {
    const [timeout, setTimeout] = useState<TimeoutState>({
        isTimedOut: false,
        startTime: null,
    });

    // Track loading start time for timeout
    useEffect(() => {
        if (loading && !timeout.startTime) {
            setTimeout({ isTimedOut: false, startTime: Date.now() });
        } else if (!loading) {
            setTimeout({ isTimedOut: false, startTime: null });
        }
    }, [loading, timeout.startTime]);

    // Check for timeout
    useEffect(() => {
        if (!loading || !timeout.startTime) return;

        const timer = window.setTimeout(() => {
            if (loading) {
                setTimeout(prev => ({ ...prev, isTimedOut: true }));
            }
        }, timeoutMs);

        return () => window.clearTimeout(timer);
    }, [loading, timeout.startTime, timeoutMs]);

    const handleRetry = useCallback(() => {
        setTimeout({ isTimedOut: false, startTime: null });
        onRetry?.();
    }, [onRetry]);

    // Timeout state
    if (timeout.isTimedOut && loading) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-md text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Taking longer than expected
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                        The request is taking longer than usual. This might be due to a slow connection.
                    </p>
                    {onRetry && (
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return loadingComponent || (
            <div className={`flex items-center justify-center p-8 ${className}`}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">{error}</p>
                    {onRetry && (
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // No data state
    if (data === null || data === undefined) {
        return (
            <EmptyState
                icon={Inbox}
                title={emptyState?.title || 'No data available'}
                description={emptyState?.description}
                action={emptyState?.action}
                className={className}
            />
        );
    }

    // Empty data check (for arrays, objects, etc.)
    const dataIsEmpty = isEmpty
        ? isEmpty(data)
        : Array.isArray(data) && data.length === 0;

    if (dataIsEmpty) {
        return (
            <EmptyState
                icon={Inbox}
                title={emptyState?.title || 'No items found'}
                description={emptyState?.description || 'There are no items to display.'}
                action={emptyState?.action}
                className={className}
            />
        );
    }

    // Render children with data
    return <>{children(data)}</>;
}

export default DataStateWrapper;
