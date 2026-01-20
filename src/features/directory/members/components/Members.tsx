/**
 * Members Component (Enhanced)
 * Main container for members management with premium UI polish
 */

import React, { useState, useMemo } from 'react';
import { Filter, Plus, Upload, Users, TrendingUp, DollarSign } from 'lucide-react';
import { Member, ViewState } from '@/core/types';
import { useAuth } from '@/core/auth';
import { useMembers } from '@/hooks';
import { transformMembers } from '@/lib/transformers/memberTransformer';
import { PageLayout, Section } from '@/shared/components/layout';
import { Button, SearchInput, ErrorDisplay } from '@/shared/components/ui';
import { MembersSkeleton } from '@/shared/components/ui';
import { MembersList } from './MembersList';
import { MemberDetail } from './MemberDetail';
import { AddMemberModal } from './AddMemberModal';
import BulkMemberUpload from './BulkMemberUpload';
import { cn } from '@/lib/utils/cn';

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

  // Calculate stats
  const stats = useMemo(() => {
    const active = members.filter(m => m.status === 'Active').length;
    const totalSavings = members.reduce((sum, m) => sum + (m.savingsBalance || 0), 0);
    const totalLoans = members.reduce((sum, m) => sum + (m.loanBalance || 0), 0);
    return { active, totalSavings, totalLoans, total: members.length };
  }, [members]);

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
      <div className="relative h-[calc(100vh-100px)] flex flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-1">
          <StatCard
            label="Total Members"
            value={stats.total.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Active"
            value={stats.active.toLocaleString()}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Total Savings"
            value={`${(stats.totalSavings / 1000000).toFixed(1)}M RWF`}
            icon={DollarSign}
            color="indigo"
          />
          <StatCard
            label="Total Loans"
            value={`${(stats.totalLoans / 1000000).toFixed(1)}M RWF`}
            icon={TrendingUp}
            color="amber"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-6 min-h-0">
          {/* List Section */}
          <div
            className={cn(
              'flex-1 flex flex-col overflow-hidden transition-all duration-300',
              'bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80',
              'shadow-xl shadow-slate-200/50',
              selectedMember ? 'w-1/2 hidden lg:flex' : 'w-full'
            )}
          >
            {/* Error Display */}
            {error && <ErrorDisplay error={error} variant="banner" />}

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
              <div>
                <div className="relative w-72">
                  <SearchInput
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm('')}
                    className="bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 ml-1">
                  {filteredMembers.length} of {members.length} members
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 text-slate-500 hover:bg-white hover:text-slate-700 rounded-xl transition-all shadow-sm border border-slate-200/50 hover:shadow-md">
                  <Filter size={18} />
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Upload size={16} />}
                  onClick={() => setIsBulkUploadOpen(true)}
                  className="shadow-sm hover:shadow-md"
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
                  className="shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
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

// Stats Card Component
interface StatCardProps {
  label: string;
  value: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: 'blue' | 'green' | 'indigo' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-emerald-500 to-green-600 shadow-green-500/30',
    indigo: 'from-indigo-500 to-purple-600 shadow-indigo-500/30',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/30',
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/80 p-4 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'bg-gradient-to-br text-white shadow-lg',
          colorClasses[color]
        )}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
};

export default Members;
