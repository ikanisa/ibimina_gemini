/**
 * GroupsList Component
 * Displays list of groups in a table format
 */

import React from 'react';
import { Group } from '@/core/types';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table';
import { StatusIndicator } from '@/shared/components/ui/StatusIndicator';
import { Calendar, ChevronRight, Briefcase } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui';
import { VirtualizedGroupsList } from './VirtualizedGroupsList';
import { useIsMobile } from '@/hooks/useResponsive';

interface GroupsListProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  searchTerm?: string;
}

export const GroupsList: React.FC<GroupsListProps> = React.memo(({
  groups,
  onSelectGroup,
  searchTerm = '',
}) => {
  const isMobile = useIsMobile();
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredGroups.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No groups found"
        description={searchTerm ? 'No groups match your search.' : 'Create your first group to get started.'}
      />
    );
  }

  // Use virtualization for large lists (50+ items)
  const useVirtualization = filteredGroups.length > 50;

  if (useVirtualization) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col h-full">
        <VirtualizedGroupsList
          groups={filteredGroups}
          onSelectGroup={onSelectGroup}
        />
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      {!isMobile && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Contribution Day</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="text-right">Fund Balance</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredGroups.map((group) => (
              <TableRow
                key={group.id}
                onClick={() => onSelectGroup(group)}
                hover
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                      {group.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-neutral-100">{group.name}</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">{group.code}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-neutral-400">
                  {group.cycleLabel}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300">
                    <Calendar size={12} />
                    {group.meetingDay}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-600 border-2 border-white dark:border-neutral-800"
                      />
                    ))}
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-700 border-2 border-white dark:border-neutral-800 flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-neutral-300">
                      +{Math.max(group.memberCount - 3, 0)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                    {group.fundBalance.toLocaleString()} RWF
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <StatusIndicator
                    status={group.status === 'Active' ? 'active' : 'inactive'}
                    label={group.status}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-center text-slate-400 dark:text-neutral-500">
                  <ChevronRight size={20} />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <div className="p-4 space-y-3">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className="bg-white dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700 p-4 space-y-3 cursor-pointer active:bg-slate-50 dark:active:bg-neutral-700 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl shrink-0">
                  {group.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">{group.name}</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono truncate">{group.code}</p>
                </div>
                <ChevronRight size={20} className="text-slate-400 dark:text-neutral-500 shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-neutral-700">
                <div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 uppercase mb-1">Cycle</p>
                  <p className="text-sm text-slate-900 dark:text-neutral-100">{group.cycleLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 uppercase mb-1">Contribution Day</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300">
                    <Calendar size={12} />
                    {group.meetingDay}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-neutral-700">
                <div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 uppercase mb-1">Members</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">{group.memberCount} members</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 uppercase mb-1">Status</p>
                  <StatusIndicator
                    status={group.status === 'Active' ? 'active' : 'inactive'}
                    label={group.status}
                    size="sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-neutral-700">
                <p className="text-xs text-slate-500 dark:text-neutral-400 uppercase mb-1">Fund Balance</p>
                <p className="text-lg font-bold text-slate-900 dark:text-neutral-100">{group.fundBalance.toLocaleString()} RWF</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
});
