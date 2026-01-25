/**
 * ErrorPage Component
 * Reusable error display page for error boundaries
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export interface ErrorPageProps {
    error?: Error;
    resetErrorBoundary?: () => void;
    title?: string;
    message?: string;
    showGoBack?: boolean;
    showGoHome?: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
    error,
    resetErrorBoundary,
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    showGoBack = true,
    showGoHome = true,
}) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-md w-full p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <AlertTriangle className="text-red-600" size={32} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>

                <p className="text-slate-600 mb-6">{message}</p>

                {import.meta.env.DEV && error && (
                    <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm font-mono text-red-600 break-all">
                            {error.toString()}
                        </p>
                        {error.stack && (
                            <pre className="text-xs text-slate-500 mt-2 overflow-auto max-h-32">
                                {error.stack}
                            </pre>
                        )}
                    </div>
                )}

                <div className="flex gap-3 justify-center flex-wrap">
                    {resetErrorBoundary && (
                        <button
                            onClick={resetErrorBoundary}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <RefreshCw size={18} />
                            Try Again
                        </button>
                    )}

                    {showGoBack && (
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    )}

                    {showGoHome && (
                        <button
                            onClick={() => (window.location.href = '/')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                        >
                            <Home size={18} />
                            Go Home
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
