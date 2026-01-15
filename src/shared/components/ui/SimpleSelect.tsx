/**
 * SimpleSelect Component
 * Simplified select field with consistent styling
 */

import React from 'react';
import { cn } from '../../lib/utils/cn';

interface SimpleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
  label,
  error,
  hint,
  required,
  options,
  className,
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        {...props}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'bg-white',
          error
            ? 'border-red-300 bg-red-50'
            : 'border-slate-300 hover:border-slate-400',
          className
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};
