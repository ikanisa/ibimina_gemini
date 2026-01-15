import React from 'react';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
    error?: Error;
    resetErrorBoundary?: () => void;
    title?: string;
    message?: string;
    showGoHome?: boolean;
    showGoBack?: boolean;
}

/**
 * ErrorPage
 * A full-page error display component with "Soft Liquid Glass" styling.
 * Used by GlobalErrorBoundary and full-page RouteErrorBoundary fallbacks.
 */
export const ErrorPage: React.FC<ErrorPageProps> = ({
    error,
    resetErrorBoundary,
    title = 'Something went wrong',
    message = 'We encountered an unexpected error. Please try reloading the page.',
    showGoHome = true,
    showGoBack = false,
}) => {
    const handleReload = () => {
        if (resetErrorBoundary) {
            resetErrorBoundary();
        } else {
            window.location.reload();
        }
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-inter">
            <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-8 text-center relative overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Soft background gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />

                <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-inner ring-4 ring-red-50/50">
                    <AlertTriangle size={32} strokeWidth={2} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                    {title}
                </h1>

                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                    {message}
                </p>

                {/* Error Details (Development - full details) */}
                {import.meta.env.DEV && error && (
                    <div className="mb-8 text-left bg-red-50/50 p-4 rounded-lg border border-red-100 overflow-auto max-h-48 scrollbar-thin scrollbar-thumb-red-200">
                        <p className="text-xs font-mono text-red-700 font-medium break-all">
                            {error.toString()}
                        </p>
                    </div>
                )}

                {/* Error Hint (Production - sanitized for debugging) */}
                {import.meta.env.PROD && error && (
                    <div className="mb-6 text-left bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">
                            <span className="font-medium">Error Type:</span>{' '}
                            <span className="font-mono">{error.name || 'Unknown'}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                            Check browser console (F12) for full details.
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleReload}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10 font-medium text-sm group"
                    >
                        <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        Try Again
                    </button>

                    <div className="flex gap-3">
                        {showGoBack && (
                            <button
                                onClick={handleGoBack}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98] font-medium text-sm"
                            >
                                <ArrowLeft size={16} />
                                Go Back
                            </button>
                        )}

                        {showGoHome && (
                            <button
                                onClick={handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98] font-medium text-sm"
                            >
                                <Home size={16} />
                                Home
                            </button>
                        )}
                    </div>
                </div>

                <p className="mt-8 text-[10px] text-slate-400 font-mono tracking-wider">
                    ERROR ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
            </div>
        </div>
    );
};
