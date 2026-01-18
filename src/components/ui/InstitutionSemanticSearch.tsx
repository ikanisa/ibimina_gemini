/**
 * InstitutionSemanticSearch Component
 * 
 * Reusable semantic/fuzzy search component for selecting institutions.
 * Features:
 * - Debounced search as user types
 * - Dropdown with matching results
 * - Click-to-select with ID returned to parent
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Building, Search, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface Institution {
    id: string;
    name: string;
    status?: string;
}

interface InstitutionSemanticSearchProps {
    value: string; // institution_id
    onChange: (institutionId: string, institutionName: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export const InstitutionSemanticSearch: React.FC<InstitutionSemanticSearchProps> = ({
    value,
    onChange,
    placeholder = 'Search for institution...',
    label,
    required = false,
    error,
    disabled = false,
    className = '',
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [displayValue, setDisplayValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Load institution name if value is set (for edit mode)
    useEffect(() => {
        if (value && !displayValue) {
            loadInstitutionName(value);
        }
    }, [value]);

    const loadInstitutionName = async (institutionId: string) => {
        try {
            const { data } = await supabase
                .from('institutions')
                .select('name')
                .eq('id', institutionId)
                .single();

            if (data?.name) {
                setDisplayValue(data.name);
            }
        } catch (err) {
            console.error('Failed to load institution name:', err);
        }
    };

    // Search institutions with debounce
    const searchInstitutions = useCallback(async (term: string) => {
        if (!term.trim()) {
            setInstitutions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Try RPC for intelligent fuzzy search (trigrams)
            const { data, error } = await supabase
                .rpc('search_institutions', { search_term: term });

            if (error) {
                console.warn('RPC search_institutions failed, falling back to direct query:', error.message);
                // Fallback: direct ILIKE query if RPC doesn't exist or fails
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('institutions')
                    .select('id, name, status')
                    .ilike('name', `%${term}%`)
                    .limit(20);

                if (fallbackError) throw fallbackError;
                setInstitutions(fallbackData || []);
            } else {
                setInstitutions(data || []);
            }
        } catch (err) {
            console.error('Error searching institutions:', err);
            setInstitutions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search handler
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setDisplayValue(term);
        setIsOpen(true);
        setHighlightedIndex(-1);

        // Clear any existing value when user starts typing
        if (value) {
            onChange('', '');
        }

        // Debounce the search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            searchInstitutions(term);
        }, 300);
    };

    // Select an institution
    const handleSelect = (institution: Institution) => {
        setDisplayValue(institution.name);
        setSearchTerm('');
        setIsOpen(false);
        onChange(institution.id, institution.name);
    };

    // Clear selection
    const handleClear = () => {
        setDisplayValue('');
        setSearchTerm('');
        setInstitutions([]);
        onChange('', '');
        inputRef.current?.focus();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || institutions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < institutions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : institutions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && institutions[highlightedIndex]) {
                    handleSelect(institutions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                <Building
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={16}
                />

                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => displayValue && !value && searchInstitutions(displayValue)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
            w-full pl-10 pr-10 py-2.5 bg-white border rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
            ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}
            ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}
          `}
                />

                {/* Right side icons */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isLoading && (
                        <Loader2 size={16} className="text-slate-400 animate-spin" />
                    )}
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                        >
                            <X size={14} />
                        </button>
                    )}
                    {value && (
                        <Check size={16} className="text-green-500" />
                    )}
                    {!value && !isLoading && (
                        <Search size={16} className="text-slate-400" />
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (institutions.length > 0 || isLoading) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading && institutions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            Searching...
                        </div>
                    ) : (
                        institutions.map((inst, index) => (
                            <button
                                key={inst.id}
                                type="button"
                                onClick={() => handleSelect(inst)}
                                className={`
                  w-full px-4 py-2.5 text-left text-sm flex items-center gap-3
                  transition-colors
                  ${index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}
                  ${inst.id === value ? 'bg-green-50 text-green-700' : ''}
                `}
                            >
                                <Building size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">{inst.name}</span>
                                {inst.id === value && (
                                    <Check size={14} className="ml-auto text-green-500 shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* No results message */}
            {isOpen && !isLoading && searchTerm && institutions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                    <div className="px-4 py-3 text-sm text-slate-500">
                        No institutions found for "{searchTerm}"
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
        </div>
    );
};

export default InstitutionSemanticSearch;
