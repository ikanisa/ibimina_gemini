/**
 * Reusable Error Display Component
 */

import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { getUserFriendlyMessage } from '@/lib/errors/ErrorHandler';

export interface ErrorDisplayProps {
  error: unknown;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'banner' | 'timeout';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  onRetry,
  className = '',
  variant = 'default'
}) => {
  const message = variant === 'timeout'
    ? 'Request timed out. Please check your connection and try again.'
    : getUserFriendlyMessage(error);

  if (variant === 'inline') {
    return (
      <div className={`text-sm text-red-600 flex items-center gap-2 ${className}`}>
        <AlertCircle size={16} />
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 text-red-700 hover:text-red-800 underline underline-offset-2 text-xs"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-red-50 border-l-4 border-l-red-500 border-y border-r border-red-200 text-red-700 px-4 py-3 rounded-r-lg text-sm flex items-center gap-3 ${className}`}>
        <AlertCircle size={18} className="text-red-500 shrink-0" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 shrink-0"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }


  if (variant === 'timeout') {
    return (
      <div className={`bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${className}`}>
        <AlertCircle size={16} />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors"
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${className}`}>
      <AlertCircle size={16} />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-xs font-medium transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

