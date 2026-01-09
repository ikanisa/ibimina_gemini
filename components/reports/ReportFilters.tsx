/**
 * ReportFilters Component
 * Filter controls for reports (scope, date range, status)
 */

import React from 'react';
import { Building2, Briefcase, User, Calendar } from 'lucide-react';
import { SearchInput, Button } from '../ui';
import { ReportScope, StatusFilter, GroupOption, MemberOption } from './types';

interface ReportFiltersProps {
  scope: ReportScope;
  onScopeChange: (scope: ReportScope) => void;
  scopeId: string | null;
  scopeName: string;
  onScopeIdChange: (id: string, name: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  groups: GroupOption[];
  members: MemberOption[];
  isPlatformAdmin: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  scope,
  onScopeChange,
  scopeId,
  scopeName,
  onScopeIdChange,
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  showFilters,
  onToggleFilters,
  groups,
  members,
  isPlatformAdmin,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      {/* Scope Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onScopeChange('institution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scope === 'institution'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 size={16} />
          Institution
        </button>
        <button
          onClick={() => onScopeChange('group')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scope === 'group'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Briefcase size={16} />
          Group
        </button>
        <button
          onClick={() => onScopeChange('member')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scope === 'member'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <User size={16} />
          Member
        </button>
      </div>

      {/* Group/Member Picker */}
      {(scope === 'group' || scope === 'member') && (
        <div className="space-y-2">
          <SearchInput
            placeholder={`Search ${scope === 'group' ? 'groups' : 'members'}...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg">
            {(scope === 'group' ? groups : members)
              .filter((item) => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                if (scope === 'group') {
                  const group = item as GroupOption;
                  return (
                    group.group_name.toLowerCase().includes(term) ||
                    group.group_code?.toLowerCase().includes(term)
                  );
                } else {
                  const member = item as MemberOption;
                  return (
                    member.full_name.toLowerCase().includes(term) ||
                    member.member_code?.toLowerCase().includes(term) ||
                    member.phone?.includes(term)
                  );
                }
              })
              .map((item) => {
                const itemId = item.id;
                const itemName =
                  scope === 'group'
                    ? (item as GroupOption).group_name
                    : (item as MemberOption).full_name;
                const itemCode =
                  scope === 'group'
                    ? (item as GroupOption).group_code
                    : (item as MemberOption).member_code;
                const isSelected = scopeId === itemId;

                return (
                  <button
                    key={itemId}
                    onClick={() => onScopeIdChange(itemId, itemName)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {itemName}
                    {itemCode && <span className="ml-1 text-xs opacity-70">({itemCode})</span>}
                  </button>
                );
              })}
            {(scope === 'group' ? groups : members).length === 0 && (
              <p className="text-sm text-slate-500 p-2">
                No {scope === 'group' ? 'groups' : 'members'} found
              </p>
            )}
          </div>
        </div>
      )}

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, start: e.target.value })
              }
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, end: e.target.value })
              }
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="allocated">Allocated</option>
              <option value="unallocated">Unallocated</option>
              <option value="error">Error</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                onDateRangeChange({
                  start: start.toISOString().split('T')[0],
                  end: end.toISOString().split('T')[0],
                });
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                onDateRangeChange({
                  start: start.toISOString().split('T')[0],
                  end: end.toISOString().split('T')[0],
                });
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Last 30 days
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                onDateRangeChange({
                  start: start.toISOString().split('T')[0],
                  end: end.toISOString().split('T')[0],
                });
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              This Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
