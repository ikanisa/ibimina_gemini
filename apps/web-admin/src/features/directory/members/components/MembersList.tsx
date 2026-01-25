/**
 * MembersList Component
 * Displays list of members with premium UI polish
 */

import React, { useRef, useEffect } from 'react';
import { Member } from '@/core/types';
import { Badge, EmptyState, LoadingSpinner } from '@/shared/components/ui';
import { MoreHorizontal, User, Loader2, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { VirtualizedMembersList } from './VirtualizedMembersList';
import { useIsMobile } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils/cn';

interface MembersListProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
  searchTerm?: string;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  selectedMemberId?: string;
  onAddMember?: () => void;
}

export const MembersList: React.FC<MembersListProps> = React.memo(({
  members,
  onSelectMember,
  searchTerm = '',
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  selectedMemberId,
  onAddMember,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm)
  );

  // Infinite scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore) return;

    const handleScroll = () => {
      if (!hasMore || loadingMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 300) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, onLoadMore]);

  if (loading && members.length === 0) {
    return <LoadingSpinner size="lg" text="Loading members..." />;
  }

  if (filteredMembers.length === 0) {
    return (
      <EmptyState
        icon={User}
        title={searchTerm ? 'No members found' : 'No members yet'}
        description={
          searchTerm
            ? 'No members match your search.'
            : 'Add members to get started.'
        }
        action={
          !searchTerm && onAddMember ? (
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onAddMember}>
              Add First Member
            </Button>
          ) : undefined
        }
      />
    );
  }

  // Use virtualization for large lists (50+ items)
  const useVirtualization = filteredMembers.length > 50;

  if (useVirtualization) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col">
        <VirtualizedMembersList
          members={filteredMembers}
          selectedMemberId={selectedMemberId}
          onSelectMember={onSelectMember}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onScroll={onLoadMore}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-y-auto flex-1">
      {/* Desktop Table View */}
      {!isMobile && (
        <>
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-3 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-4">Member</div>
            <div className="col-span-3">Ibimina (Groups)</div>
            <div className="col-span-2 text-right">Savings</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Body */}
          {filteredMembers.map((member, index) => (
            <div
              key={member.id}
              onClick={() => onSelectMember(member)}
              className={cn(
                'grid grid-cols-12 px-4 py-3.5 items-center border-b border-slate-50 cursor-pointer transition-all duration-200 touch-manipulation min-h-[64px] group',
                selectedMemberId === member.id
                  ? 'bg-blue-50/80 ring-2 ring-blue-200 ring-inset'
                  : 'hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent',
                'animate-in fade-in slide-in-from-left-1'
              )}
              style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="relative">
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-xl bg-slate-200 object-cover shadow-sm ring-2 ring-white"
                  />
                  {member.status === 'Active' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.phone}</p>
                </div>
              </div>
              <div className="col-span-3 text-sm text-slate-600">
                {member.groups.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {member.groups.slice(0, 2).map((group, idx) => {
                      const role = member.groupRoles?.[group];
                      const isLeader = role === 'LEADER' || role === 'Leader' || role === 'CHAIRPERSON' || role === 'Chairperson';
                      return (
                        <span
                          key={idx}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-lg border truncate max-w-[110px]',
                            isLeader
                              ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200'
                              : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200'
                          )}
                          title={role ? `Role: ${role}` : undefined}
                        >
                          {group}
                          {isLeader && <span>👑</span>}
                        </span>
                      );
                    })}
                    {member.groups.length > 2 && (
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-md">
                        +{member.groups.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">No groups</span>
                )}
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm font-bold text-slate-900">
                  {member.savingsBalance.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-1">RWF</span>
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
              <div className="col-span-1 flex justify-end items-center gap-1 text-slate-400 group-hover:text-blue-500 transition-colors">
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </>
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <div className="p-4 space-y-3">
          {filteredMembers.map((member, index) => (
            <div
              key={member.id}
              onClick={() => onSelectMember(member)}
              className={cn(
                'bg-white rounded-2xl border border-slate-200 p-4 space-y-3 cursor-pointer transition-all duration-200 active:scale-[0.98]',
                selectedMemberId === member.id
                  ? 'ring-2 ring-blue-300 border-blue-300 shadow-lg shadow-blue-500/20'
                  : 'hover:shadow-lg hover:border-slate-300',
                'animate-in fade-in slide-in-from-bottom-1'
              )}
              style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-14 h-14 rounded-xl bg-slate-200 object-cover shrink-0 shadow-md"
                  />
                  {member.status === 'Active' && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                  <p className="text-xs text-slate-500 truncate">{member.phone}</p>
                </div>
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

              {member.groups.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-medium mb-2">Ibimina (Groups)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.groups.slice(0, 3).map((group, idx) => {
                      const role = member.groupRoles?.[group];
                      const isLeader = role === 'LEADER' || role === 'Leader' || role === 'CHAIRPERSON' || role === 'Chairperson';
                      return (
                        <span
                          key={idx}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border',
                            isLeader
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          )}
                        >
                          {group}
                          {isLeader && <span>👑</span>}
                        </span>
                      );
                    })}
                    {member.groups.length > 3 && (
                      <span className="text-xs text-slate-400 px-2 py-1 bg-slate-100 rounded-lg">
                        +{member.groups.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Savings Balance</p>
                <p className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {member.savingsBalance.toLocaleString()} <span className="text-sm font-medium text-slate-400">RWF</span>
                </p>
              </div>
            </div>
          ))}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="px-4 py-6 text-center">
              <div className="inline-flex items-center justify-center gap-2 text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            </div>
          )}

          {/* End of list indicator */}
          {!hasMore && members.length > 0 && !searchTerm && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              All {members.length} members loaded
            </div>
          )}
        </div>
      )}

      {/* Loading more indicator (Desktop) */}
      {!isMobile && loadingMore && (
        <div className="px-4 py-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        </div>
      )}

      {/* End of list indicator (Desktop) */}
      {!isMobile && !hasMore && members.length > 0 && !searchTerm && (
        <div className="px-4 py-6 text-center text-sm text-slate-400">
          All {members.length} members loaded
        </div>
      )}
    </div>
  );
});
