import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorAlertProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
    variant?: 'default' | 'compact';
}

/**
 * ErrorAlert
 * Inline error component for section-level failures.
 * Designed to fit within content areas without breaking layout.
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
    title = 'Error',
    message = 'Something went wrong.',
    onRetry,
    onDismiss,
    variant = 'default',
}) => {
    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={16} className="shrink-0" />
                <span className="flex-1 font-medium truncate">{message}</span>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="p-1 hover:bg-red-100 rounded-md transition-colors"
                        title="Retry"
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="group relative overflow-hidden rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />

            <div className="flex items-start gap-3 pl-2">
                <div className="shrink-0 text-red-500 mt-0.5">
                    <AlertCircle size={18} />
                </div>

                <div className="flex-1 space-y-1">
                    {title && (
                        <h3 className="font-semibold text-red-900 leading-tight">
                            {title}
                        </h3>
                    )}
                    <div className="text-red-700 leading-relaxed">
                        {message}
                    </div>

                    {onRetry && (
                        <div className="pt-2">
                            <button
                                onClick={onRetry}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-700 border border-red-200 rounded-lg text-xs font-medium shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
                            >
                                <RefreshCw size={12} />
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="shrink-0 text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Dismiss"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
