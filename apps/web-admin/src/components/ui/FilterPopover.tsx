/**
 * FilterPopover Component
 * 
 * Consolidates multiple filter controls into a single dropdown popover.
 * Reduces visual clutter in filter bars while maintaining filter functionality.
 */

import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { Button } from './Button';

export interface FilterOption<T extends string = string> {
    value: T;
    label: string;
}

export interface FilterGroup<T extends string = string> {
    id: string;
    label: string;
    options: FilterOption<T>[];
    value: T;
    onChange: (value: T) => void;
}

export interface FilterPopoverProps {
    /** Filter groups to display */
    filters: FilterGroup[];
    /** Callback to clear all filters */
    onClearAll?: () => void;
    /** Button label when all filters are default */
    defaultLabel?: string;
    /** Additional CSS classes */
    className?: string;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
    filters,
    onClearAll,
    defaultLabel = 'Filters',
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Count active (non-default) filters
    const activeFilterCount = filters.filter(f =>
        f.options.length > 0 && f.value !== f.options[0].value
    ).length;

    const hasActiveFilters = activeFilterCount > 0;

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={popoverRef}>
            <Button
                variant={hasActiveFilters ? 'primary' : 'secondary'}
                size="sm"
                leftIcon={<SlidersHorizontal size={14} />}
                onClick={() => setIsOpen(!isOpen)}
            >
                {defaultLabel}
                {hasActiveFilters && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white/20">
                        {activeFilterCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-700">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                            Filters
                        </h4>
                        {hasActiveFilters && onClearAll && (
                            <button
                                onClick={() => {
                                    onClearAll();
                                    setIsOpen(false);
                                }}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                <X size={12} />
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Filter Groups */}
                    <div className="max-h-80 overflow-y-auto">
                        {filters.map((filter, groupIndex) => (
                            <div
                                key={filter.id}
                                className={`px-4 py-3 ${groupIndex < filters.length - 1 ? 'border-b border-slate-100 dark:border-neutral-700' : ''
                                    }`}
                            >
                                <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                    {filter.label}
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {filter.options.map((option) => {
                                        const isSelected = filter.value === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => filter.onChange(option.value)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${isSelected
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-600'
                                                    }`}
                                            >
                                                {isSelected && <Check size={12} />}
                                                <span className="truncate">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-700">
                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            onClick={() => setIsOpen(false)}
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterPopover;
