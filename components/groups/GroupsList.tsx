/**
 * GroupsList Component
 * Displays list of groups in a table format
 */

import React from 'react';
import { Group } from '../../types';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../ui/Table';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Calendar, ChevronRight, Briefcase } from 'lucide-react';
import { EmptyState } from '../ui';
import { VirtualizedGroupsList } from './VirtualizedGroupsList';

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Group Name</TableHead>
          <TableHead>Cycle</TableHead>
          <TableHead>Meeting Day</TableHead>
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
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {group.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{group.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{group.code}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm text-slate-600">
              {group.cycleLabel}
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <Calendar size={12} />
                {group.meetingDay}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"
                  />
                ))}
                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600">
                  +{Math.max(group.memberCount - 3, 0)}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-sm font-bold text-slate-900">
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
            <TableCell className="text-center text-slate-400">
              <ChevronRight size={20} />
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
});
