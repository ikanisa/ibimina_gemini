/**
 * Reusable Search Input Component
 * 
 * Accessible search input with proper ARIA attributes
 */

import React, { useId, forwardRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClearButton?: boolean;
  /** Label for screen readers (hidden visually) */
  label?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onClear,
  showClearButton = true,
  className = '',
  label = 'Search',
  placeholder,
  ...props
}, ref) => {
  const hasValue = value && String(value).length > 0;
  const inputId = useId();

  return (
    <div className="relative" role="search">
      {/* Hidden label for screen readers */}
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        size={16}
        aria-hidden="true"
      />
      <input
        ref={ref}
        id={inputId}
        type="search"
        role="searchbox"
        className={`
          pl-9 pr-9 py-2
          bg-slate-50 border border-slate-200 rounded-lg
          text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${className}
        `}
        value={value}
        placeholder={placeholder || `${label}...`}
        {...props}
      />
      {showClearButton && hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Clear ${label.toLowerCase()}`}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

