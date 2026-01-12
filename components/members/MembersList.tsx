/**
 * MembersList Component
 * Displays list of members in a grid/table format
 */

import React, { useRef, useEffect } from 'react';
import { Member } from '../../types';
import { Badge, EmptyState, LoadingSpinner } from '../ui';
import { MoreHorizontal, User, Loader2, Plus } from 'lucide-react';
import { Button } from '../ui';
import { VirtualizedMembersList } from './VirtualizedMembersList';

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
  useMockData?: boolean;
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
  useMockData = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm)
  );

  // Infinite scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container || useMockData || !onLoadMore) return;

    const handleScroll = () => {
      if (!hasMore || loadingMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 300) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, onLoadMore, useMockData]);

  if (loading && members.length === 0) {
    return <LoadingSpinner size="lg" text="Loading members..." />;
  }

  if (filteredMembers.length === 0) {
    return (
      <EmptyState
        icon={User}
        title={searchTerm ? 'No members found' : useMockData ? 'No members found' : 'No members yet'}
        description={
          searchTerm
            ? 'No members match your search.'
            : useMockData
            ? 'No members match your search.'
            : 'Add members to get started.'
        }
        action={
          !useMockData && !searchTerm && onAddMember ? (
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
      {/* Table Header */}
      <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="col-span-4">Member</div>
        <div className="col-span-3">Ibimina (Groups)</div>
        <div className="col-span-2 text-right">Savings</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-1"></div>
      </div>

      {/* Table Body */}
      {filteredMembers.map((member) => (
        <div
          key={member.id}
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
      ))}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && members.length > 0 && !searchTerm && (
        <div className="px-4 py-4 text-center text-sm text-slate-400">
          All {members.length} members loaded
        </div>
      )}
    </div>
  );
});
