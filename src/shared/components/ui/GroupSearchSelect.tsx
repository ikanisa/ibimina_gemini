/**
 * GroupSearchSelect Component
 * 
 * Smart semantic group search/select with debounced input,
 * fuzzy matching, and premium glassmorphic styling.
 */

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { Search, Users, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { supabase } from '@/core/config/supabase';
import { useAuth } from '@/core/auth';

export interface GroupOption {
    id: string;
    name: string;
    memberCount?: number;
    frequency?: string;
    status?: string;
}

export interface GroupSearchSelectProps {
    label?: string;
    value: string | null;
    onChange: (groupId: string | null, group: GroupOption | null) => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const GroupSearchSelect: React.FC<GroupSearchSelectProps> = ({
    label,
    value,
    onChange,
    error,
    required = false,
    placeholder = 'Search for a group...',
    disabled = false,
    className,
}) => {
    const { institutionId } = useAuth();
    const inputId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [groups, setGroups] = useState<GroupOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupOption | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Debounce timer ref
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch selected group details on mount if value is set
    useEffect(() => {
        if (value && !selectedGroup) {
            fetchGroupById(value);
        }
    }, [value]);

    const fetchGroupById = async (groupId: string) => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('id, group_name, frequency, status')
                .eq('id', groupId)
                .single();

            if (!error && data) {
                // Get member count
                const { count } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', groupId);

                setSelectedGroup({
                    id: data.id,
                    name: data.group_name,
                    frequency: data.frequency,
                    status: data.status,
                    memberCount: count || 0,
                });
            }
        } catch (err) {
            console.error('Error fetching group:', err);
        }
    };

    // Search groups with debounce
    const searchGroups = useCallback(async (term: string) => {
        if (!institutionId) return;

        setIsLoading(true);
        try {
            let query = supabase
                .from('groups')
                .select('id, group_name, frequency, status')
                .eq('institution_id', institutionId)
                .eq('status', 'ACTIVE')
                .order('group_name', { ascending: true })
                .limit(10);

            // Apply fuzzy search if term provided
            if (term.trim()) {
                query = query.ilike('group_name', `%${term.trim()}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error searching groups:', error);
                setGroups([]);
                return;
            }

            // Get member counts for each group
            const groupsWithCounts = await Promise.all(
                (data || []).map(async (group) => {
                    const { count } = await supabase
                        .from('group_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('group_id', group.id);

                    return {
                        id: group.id,
                        name: group.group_name,
                        frequency: group.frequency,
                        status: group.status,
                        memberCount: count || 0,
                    };
                })
            );

            setGroups(groupsWithCounts);
        } catch (err) {
            console.error('Error searching groups:', err);
            setGroups([]);
        } finally {
            setIsLoading(false);
        }
    }, [institutionId]);

    // Debounced search handler
    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setHighlightedIndex(-1);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchGroups(term);
        }, 300);
    }, [searchGroups]);

    // Handle input focus
    const handleFocus = () => {
        if (!disabled) {
            setIsOpen(true);
            if (groups.length === 0) {
                searchGroups('');
            }
        }
    };

    // Handle selection
    const handleSelect = (group: GroupOption) => {
        setSelectedGroup(group);
        onChange(group.id, group);
        setSearchTerm('');
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedGroup(null);
        onChange(null, null);
        setSearchTerm('');
        inputRef.current?.focus();
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
                searchGroups('');
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < groups.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && groups[highlightedIndex]) {
                    handleSelect(groups[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
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
        <div ref={containerRef} className={cn('relative', className)}>
            {/* Label */}
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Input Container */}
            <div
                className={cn(
                    'relative flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200',
                    'bg-white/80 backdrop-blur-sm',
                    isOpen
                        ? 'border-blue-400 ring-2 ring-blue-100 shadow-lg shadow-blue-500/10'
                        : error
                            ? 'border-red-300 bg-red-50/50'
                            : 'border-slate-200 hover:border-slate-300',
                    disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
                )}
                onClick={() => !disabled && inputRef.current?.focus()}
            >
                <Search
                    size={18}
                    className={cn(
                        'shrink-0 transition-colors duration-200',
                        isOpen ? 'text-blue-500' : 'text-slate-400'
                    )}
                />

                {/* Selected Group Display or Input */}
                {selectedGroup && !isOpen ? (
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-sm text-slate-900 truncate font-medium">
                            {selectedGroup.name}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {selectedGroup.memberCount} members
                        </span>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        id={inputId}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={handleFocus}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedGroup ? selectedGroup.name : placeholder}
                        disabled={disabled}
                        className={cn(
                            'flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400',
                            disabled && 'cursor-not-allowed'
                        )}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        aria-controls={`${inputId}-listbox`}
                        role="combobox"
                    />
                )}

                {/* Clear / Dropdown Toggle */}
                {selectedGroup && !disabled ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Clear selection"
                    >
                        <X size={16} />
                    </button>
                ) : (
                    <ChevronDown
                        size={18}
                        className={cn(
                            'shrink-0 text-slate-400 transition-transform duration-200',
                            isOpen && 'rotate-180'
                        )}
                    />
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    id={`${inputId}-listbox`}
                    role="listbox"
                    className={cn(
                        'absolute z-50 w-full mt-2 py-2 rounded-xl border border-slate-200',
                        'bg-white/95 backdrop-blur-md shadow-xl shadow-slate-200/50',
                        'animate-in fade-in slide-in-from-top-2 duration-200'
                    )}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-sm">Searching groups...</span>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="py-6 text-center">
                            <Users size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500">
                                {searchTerm ? 'No groups found' : 'No groups available'}
                            </p>
                            {searchTerm && (
                                <p className="text-xs text-slate-400 mt-1">
                                    Try a different search term
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="max-h-64 overflow-y-auto">
                            {groups.map((group, index) => (
                                <button
                                    key={group.id}
                                    type="button"
                                    onClick={() => handleSelect(group)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={cn(
                                        'w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-150',
                                        highlightedIndex === index
                                            ? 'bg-blue-50'
                                            : 'hover:bg-slate-50',
                                        selectedGroup?.id === group.id && 'bg-blue-50'
                                    )}
                                    role="option"
                                    aria-selected={selectedGroup?.id === group.id}
                                >
                                    {/* Group Icon */}
                                    <div
                                        className={cn(
                                            'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                                            'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                                        )}
                                    >
                                        <Users size={18} />
                                    </div>

                                    {/* Group Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {group.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500">
                                                {group.memberCount} members
                                            </span>
                                            {group.frequency && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-xs text-slate-500">
                                                        {group.frequency}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selected Checkmark */}
                                    {selectedGroup?.id === group.id && (
                                        <Check
                                            size={18}
                                            className="shrink-0 text-blue-600"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span className="shrink-0">⚠</span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default GroupSearchSelect;
