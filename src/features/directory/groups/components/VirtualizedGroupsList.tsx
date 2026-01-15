/**
 * Virtualized Groups List Component
 * Efficiently renders large group lists using @tanstack/react-virtual
 */

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Calendar, ChevronRight } from 'lucide-react';
import { StatusIndicator } from '@/shared/components/ui/StatusIndicator';
import type { Group } from '@/core/types';

interface VirtualizedGroupsListProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  onScroll?: () => void;
}

export const VirtualizedGroupsList: React.FC<VirtualizedGroupsListProps> = ({
  groups,
  onSelectGroup,
  loadingMore = false,
  hasMore = false,
  onScroll,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: groups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height
    overscan: 10,
  });

  // Handle scroll for infinite loading
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement || !onScroll) return;

    const handleScroll = () => {
      if (!loadingMore && hasMore) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        if (scrollHeight - scrollTop - clientHeight < 300) {
          onScroll();
        }
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [onScroll, loadingMore, hasMore]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="bg-slate-50 border-b border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Group Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cycle</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contribution Day</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Fund Balance</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10"></th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Virtualized Body */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const group = groups[virtualItem.index];
            return (
              <div
                key={group.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => onSelectGroup(group)}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <table className="w-full text-left">
                  <tbody>
                    <tr>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                            {group.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{group.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{group.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {group.cycleLabel}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <Calendar size={12} />
                          {group.meetingDay}
                        </span>
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-slate-900">
                          {group.fundBalance.toLocaleString()} RWF
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusIndicator
                          status={group.status === 'Active' ? 'active' : 'inactive'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight size={16} className="text-slate-400" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="px-4 py-4 text-center border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && groups.length > 0 && (
          <div className="px-4 py-4 text-center text-sm text-slate-400 border-t border-slate-100">
            All {groups.length} groups loaded
          </div>
        )}
      </div>
    </div>
  );
};
