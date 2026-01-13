/**
 * Reusable Error Display Component
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { getUserFriendlyMessage } from '@/lib/errors/ErrorHandler';

export interface ErrorDisplayProps {
  error: unknown;
  onDismiss?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'banner';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  className = '',
  variant = 'default'
}) => {
  const message = getUserFriendlyMessage(error);

  if (variant === 'inline') {
    return (
      <div className={`text-sm text-red-600 flex items-center gap-2 ${className}`}>
        <AlertCircle size={16} />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{message}</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 ml-4"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${className}`}>
      <AlertCircle size={16} />
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto text-red-600 hover:text-red-800"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

