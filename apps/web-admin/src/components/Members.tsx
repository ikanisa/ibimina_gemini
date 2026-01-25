/**
 * Members Component (Refactored)
 * Main container for members management
 * Uses modular components from components/members/
 */

import React, { useState, useMemo } from 'react';
import { Filter, Plus, Upload } from 'lucide-react';
import { Member, ViewState } from '../types';
// Mock data removed - using only real Supabase data
import { useAuth } from '../contexts/AuthContext';
import { useMembers } from '../hooks';
import { transformMembers } from '../lib/transformers/memberTransformer';
import { PageLayout, Section } from './layout';
import { Button, SearchInput, ErrorDisplay } from './ui';
import { MembersSkeleton } from './ui/PageSkeletons';
import { MembersList } from './members/MembersList';
import { MemberDetail } from './members/MemberDetail';
import { AddMemberModal } from './members/AddMemberModal';
import BulkMemberUpload from './BulkMemberUpload';

interface MembersProps {
  members?: Member[];
  onNavigate?: (view: ViewState) => void;
}

const Members: React.FC<MembersProps> = ({ members: membersProp, onNavigate }) => {
  const { institutionId } = useAuth();

  // Use the new hook with infinite scroll support
  const {
    members: supabaseMembers,
    loading,
    loadingMore,
    error,
    hasMore,
    createMember: createMemberApi,
    refetch,
    loadMore,
  } = useMembers({
    includeGroups: true,
    autoFetch: !membersProp,
  });

  // Transform Supabase members to UI format
  const members = useMemo(() => {
    if (membersProp) return membersProp;
    if (!supabaseMembers.length) return [];

    // Transform using the transformer utility
    const groupsMap = new Map<string, string[]>();
    supabaseMembers.forEach((member: any) => {
      if (member.groups && Array.isArray(member.groups)) {
        groupsMap.set(member.id, member.groups);
      }
    });

    return transformMembers(supabaseMembers, groupsMap);
  }, [membersProp, supabaseMembers]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Filter members (client-side for already loaded data)
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const term = searchTerm.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(term) || m.phone.includes(term)
    );
  }, [members, searchTerm]);

  // Show skeleton while loading initial data
  if (loading && !membersProp && members.length === 0) {
    return (
      <PageLayout>
        <Section>
          <MembersSkeleton />
        </Section>
      </PageLayout>
    );
  }

  return (
    <>
      <div className="relative h-[calc(100vh-100px)] flex gap-6">
        {/* List Section */}
        <div
          className={`flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 ${selectedMember ? 'w-1/2 hidden lg:flex' : 'w-full'
            }`}
        >
          {/* Error Display */}
          {error && <ErrorDisplay error={error} variant="banner" />}

          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="relative w-64">
                <SearchInput
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm('')}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{members.length} members loaded</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
                <Filter size={18} />
              </button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload size={16} />}
                onClick={() => setIsBulkUploadOpen(true)}
              >
                Bulk Upload
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => {
                  if (!institutionId) {
                    alert('Please select an institution first');
                    return;
                  }
                  setIsAddModalOpen(true);
                }}
                disabled={!institutionId}
              >
                Add Member
              </Button>
            </div>
          </div>

          {/* Members List */}
          <MembersList
            members={filteredMembers}
            onSelectMember={setSelectedMember}
            searchTerm={searchTerm}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            selectedMemberId={selectedMember?.id}
            onAddMember={() => setIsAddModalOpen(true)}
          />
        </div>

        {/* Detail Drawer */}
        {selectedMember && (
          <MemberDetail
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          refetch();
        }}
        institutionId={institutionId || ''}
        createMember={createMemberApi}
      />

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <BulkMemberUpload
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={() => {
            setIsBulkUploadOpen(false);
            refetch();
          }}
        />
      )}
    </>
  );
};

export default Members;
