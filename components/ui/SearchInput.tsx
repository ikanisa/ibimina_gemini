/**
 * Reusable Search Input Component
 */

import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onClear,
  showClearButton = true,
  className = '',
  ...props
}) => {
  const hasValue = value && String(value).length > 0;

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={16}
      />
      <input
        type="text"
        className={`
          pl-9 pr-9 py-2
          bg-slate-50 border border-slate-200 rounded-lg
          text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${className}
        `}
        value={value}
        {...props}
      />
      {showClearButton && hasValue && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

