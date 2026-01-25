/**
 * Virtualized Members List Component
 * Efficiently renders large member lists using @tanstack/react-virtual
 */

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import type { Member } from '@/core/types';

interface VirtualizedMembersListProps {
  members: Member[];
  selectedMemberId?: string;
  onSelectMember: (member: Member) => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  onScroll?: () => void;
}

export const VirtualizedMembersList: React.FC<VirtualizedMembersListProps> = ({
  members,
  selectedMemberId,
  onSelectMember,
  loadingMore = false,
  hasMore = false,
  onScroll,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Row height
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
      <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="col-span-4">Member</div>
        <div className="col-span-3">Ibimina (Groups)</div>
        <div className="col-span-2 text-right">Savings</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-1"></div>
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
            const member = members[virtualItem.index];
            return (
              <div
                key={member.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => onSelectMember(member)}
                className={`grid grid-cols-12 px-4 py-3 items-center border-b border-slate-50 cursor-pointer hover:bg-blue-50/50 active:bg-blue-100 transition-all duration-150 touch-manipulation min-h-[60px] ${
                  selectedMemberId === member.id ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                }`}
              >
                <div className="col-span-4 flex items-center gap-3">
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.phone}</p>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-slate-600">
                  {member.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {member.groups.slice(0, 2).map((group, idx) => {
                        const role = member.groupRoles?.[group];
                        const isLeader = role === 'LEADER' || role === 'Leader' || role === 'CHAIRPERSON' || role === 'Chairperson';
                        return (
                          <span
                            key={idx}
                            className={`inline-block px-1.5 py-0.5 text-[10px] rounded border truncate max-w-[100px] ${
                              isLeader
                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}
                            title={role ? `Role: ${role}` : undefined}
                          >
                            {group}
                            {isLeader && ' 👑'}
                          </span>
                        );
                      })}
                      {member.groups.length > 2 && (
                        <span className="text-[10px] text-slate-400">
                          +{member.groups.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">No groups</span>
                  )}
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-slate-900">
                  {member.savingsBalance.toLocaleString()} RWF
                </div>
                <div className="col-span-2 flex justify-center">
                  <Badge
                    variant={
                      member.status === 'Active'
                        ? 'success'
                        : member.status === 'Pending'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {member.status}
                  </Badge>
                </div>
                <div className="col-span-1 flex justify-end text-slate-400">
                  <MoreHorizontal size={16} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="px-4 py-4 text-center border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && members.length > 0 && (
          <div className="px-4 py-4 text-center text-sm text-slate-400 border-t border-slate-100">
            All {members.length} members loaded
          </div>
        )}
      </div>
    </div>
  );
};
