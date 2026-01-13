/**
 * Groups Component (Refactored)
 * Main container for groups management
 * Uses modular components from components/groups/
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Calendar,
  DollarSign,
  Filter,
  Plus,
  Upload,
} from 'lucide-react';
import { MOCK_GROUPS, MOCK_GROUP_MEMBERS, MOCK_MEETINGS, MOCK_CONTRIBUTIONS, MOCK_TRANSACTIONS, MOCK_SMS } from '../constants';
import BulkGroupUpload from './BulkGroupUpload';
import {
  Contribution,
  Group,
  GroupMember,
  Meeting,
  SmsMessage,
  SupabaseGroupMember,
  SupabaseMeeting,
  SupabaseMember,
  SupabaseSmsMessage,
  SupabaseTransaction,
  Transaction,
  ViewState,
} from '../types';
import { supabase } from '../lib/supabase';
import { mapGroupMemberRole, mapGroupMemberStatus, mapTransactionStatus, mapTransactionType } from '../lib/mappers';
import { useGroups } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { transformGroups } from '../lib/transformers/groupTransformer';
import { PageLayout, Section } from './layout';
import { Button, SearchInput, ErrorDisplay, LoadingSpinner } from './ui';
import { GroupsList } from './groups/GroupsList';
import { GroupDetail } from './groups/GroupDetail';
import { CreateGroupModal } from './groups/CreateGroupModal';
import { GroupsSkeleton } from './groups/GroupsSkeleton';

interface GroupsProps {
  onNavigate?: (view: ViewState) => void;
  institutionId?: string | null;
}

const Groups: React.FC<GroupsProps> = ({ onNavigate, institutionId: institutionIdProp }) => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId: authInstitutionId } = useAuth();
  const institutionId = institutionIdProp || authInstitutionId;

  // Use the new hook instead of manual state management
  const {
    groups: supabaseGroups,
    memberCounts,
    loading,
    error,
    createGroup: createGroupApi,
    refetch,
  } = useGroups({
    includeMemberCounts: true,
    autoFetch: !useMockData,
  });

  // Transform Supabase groups to UI format
  const groups = useMemo(() => {
    if (useMockData) return MOCK_GROUPS;
    if (!supabaseGroups.length) return [];
    return transformGroups(supabaseGroups, memberCounts);
  }, [useMockData, supabaseGroups, memberCounts]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(useMockData ? MOCK_GROUP_MEMBERS : []);
  const [groupMeetings, setGroupMeetings] = useState<Meeting[]>(useMockData ? MOCK_MEETINGS : []);
  const [groupContributions, setGroupContributions] = useState<Contribution[]>(useMockData ? MOCK_CONTRIBUTIONS : []);
  const [groupTransactions, setGroupTransactions] = useState<Transaction[]>(useMockData ? MOCK_TRANSACTIONS : []);
  const [groupSms, setGroupSms] = useState<SmsMessage[]>(useMockData ? MOCK_SMS : []);

  // Create Group Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Calculate stats for header (memoized)
  const { totalGroupFunds, meetingTodayGroups, expectedCollection, totalActiveLoans } = useMemo(() => {
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const meetingToday = groups.filter((group) =>
      group.meetingDay.toLowerCase().startsWith(todayName.toLowerCase())
    );

    return {
      totalGroupFunds: groups.reduce((sum, group) => sum + group.fundBalance, 0),
      meetingTodayGroups: meetingToday,
      expectedCollection: meetingToday.reduce(
        (sum, group) => sum + group.contributionAmount * group.memberCount,
        0
      ),
      totalActiveLoans: groups.reduce((sum, group) => sum + group.activeLoansCount, 0),
    };
  }, [groups]);

  // Load group details when a group is selected
  useEffect(() => {
    if (useMockData) {
      setGroupMembers(MOCK_GROUP_MEMBERS);
      setGroupMeetings(MOCK_MEETINGS);
      setGroupContributions(MOCK_CONTRIBUTIONS);
      setGroupTransactions(MOCK_TRANSACTIONS);
      setGroupSms(MOCK_SMS);
      return;
    }

    if (!selectedGroup || !institutionId) {
      setGroupMembers([]);
      setGroupMeetings([]);
      setGroupContributions([]);
      setGroupTransactions([]);
      setGroupSms([]);
      return;
    }

    const getWeekNumber = (date: Date) => {
      const start = new Date(Date.UTC(date.getFullYear(), 0, 1));
      const diff = date.getTime() - start.getTime();
      return Math.ceil((diff / 86400000 + start.getUTCDay() + 1) / 7);
    };

    const buildPeriodLabel = (dateValue: string, frequency: 'Weekly' | 'Monthly') => {
      const date = new Date(dateValue);
      if (frequency === 'Monthly') {
        return date.toLocaleString('en-US', { month: 'short' });
      }
      return `Wk ${getWeekNumber(date)}`;
    };

    const loadGroupDetails = async () => {
      setDetailLoading(true);
      setDetailError(null);

      const [
        groupResponse,
        transactionsResponse,
      ] = await Promise.all([
        supabase
          .from('groups')
          .select('members')
          .eq('id', selectedGroup.id)
          .single(),
        supabase
          .from('transactions')
          .select('*, members(full_name)')
          .eq('group_id', selectedGroup.id)
          .eq('type', 'CONTRIBUTION')
          .order('occurred_at', { ascending: false }),
      ]);

      const responses = [groupResponse, transactionsResponse];
      const firstError = responses.find((res) => res.error)?.error;
      if (firstError) {
        console.error('Error loading group details:', firstError);
        setDetailError('Unable to load group details. Check your connection and permissions.');
      }

      // Extract members from JSONB and fetch member details
      const membersArray = (groupResponse.data?.members as any[]) || [];
      const memberIds = membersArray.map((m: any) => m.member_id).filter(Boolean);

      let membersWithNames = membersArray;
      if (memberIds.length > 0) {
        const { data: membersData } = await supabase
          .from('members')
          .select('id, full_name')
          .in('id', memberIds);

        const membersMap = new Map((membersData || []).map(m => [m.id, m.full_name]));
        membersWithNames = membersArray.map((m: any) => ({
          ...m,
          id: m.member_id || '',
          members: m.member_id ? { full_name: membersMap.get(m.member_id) || null } : null,
        }));
      }

      const membersResponse = { data: membersWithNames, error: null };
      const meetingsResponse = { data: [], error: null }; // Meetings table deleted

      // Map transactions to contributions format for compatibility
      const transactions = (transactionsResponse.data || []) as any[];
      const contributions = transactions.map(tx => ({
        id: tx.id,
        member_id: tx.member_id,
        group_id: tx.group_id,
        amount: tx.amount,
        date: tx.occurred_at,
        method: tx.channel,
        channel: tx.channel,
        reference: tx.reference || tx.momo_ref,
        status: tx.allocation_status === 'allocated' ? 'RECONCILED' : 'RECORDED',
        created_at: tx.created_at,
      }));
      const expectedAmount = selectedGroup.contributionAmount || 0;

      const mappedContributions: Contribution[] = contributions.map((contribution) => {
        const paidAmount = Number(contribution.amount);
        const status =
          paidAmount >= expectedAmount
            ? 'Paid'
            : paidAmount > 0
              ? 'Partial'
              : 'Missed';
        const channelValue = (contribution.channel ?? contribution.method ?? 'Cash').toLowerCase();
        const channel =
          channelValue.includes('momo')
            ? 'MoMo'
            : channelValue.includes('token')
              ? 'Token'
              : 'Cash';

        return {
          id: contribution.id,
          memberId: contribution.member_id,
          groupId: contribution.group_id,
          meetingId: '', // Meetings table deleted
          periodLabel: buildPeriodLabel(contribution.date, selectedGroup.contributionFrequency),
          expectedAmount,
          paidAmount,
          status,
          channel,
        };
      });

      const contributionStats = mappedContributions.reduce((acc, contribution) => {
        const entry = acc[contribution.memberId] ?? { paid: 0, missed: 0 };
        if (contribution.status === 'Paid') {
          entry.paid += 1;
        } else if (contribution.status === 'Missed') {
          entry.missed += 1;
        }
        acc[contribution.memberId] = entry;
        return acc;
      }, {} as Record<string, { paid: number; missed: number }>);

      type GroupMemberRow = {
        member_id: string;
        role: SupabaseGroupMember['role'];
        status: SupabaseGroupMember['status'];
        joined_date?: string | null;
        members?: { full_name?: string | null }[] | { full_name?: string | null } | null;
      };

      const mappedMembers: GroupMember[] = (
        (membersResponse.data as GroupMemberRow[] | null) ?? []
      ).map((member) => {
        const stats = contributionStats[member.member_id] ?? { paid: 0, missed: 0 };
        const memberName = Array.isArray(member.members)
          ? member.members[0]?.full_name
          : member.members?.full_name;
        return {
          memberId: member.member_id,
          name: memberName ?? 'Member',
          role: mapGroupMemberRole(member.role),
          status: mapGroupMemberStatus(member.status),
          joinedDate: member.joined_date ?? '—',
          contributionsPaid: stats.paid,
          contributionsMissed: stats.missed,
        };
      });

      const mappedMeetings: Meeting[] = (
        (meetingsResponse.data as SupabaseMeeting[] | null) ?? []
      ).map((meeting) => ({
        id: meeting.id,
        groupId: meeting.group_id,
        date: meeting.date,
        type: meeting.type as Meeting['type'],
        attendanceCount: meeting.attendance_count,
        totalCollected: Number(meeting.total_collected),
        notes: meeting.notes ?? '',
        status: meeting.status === 'COMPLETED' ? 'Completed' : 'Scheduled',
      }));

      const mappedTransactions: Transaction[] = (
        (transactionsResponse.data as (SupabaseTransaction & { members?: SupabaseMember | null })[] | null) ?? []
      ).map((tx) => {
        const date = new Date(tx.created_at);
        const dateLabel = `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`;
        return {
          id: tx.id,
          date: dateLabel,
          memberId: tx.member_id ?? '—',
          memberName: tx.members?.full_name ?? 'Unknown',
          type: mapTransactionType(tx.type),
          amount: Number(tx.amount),
          currency: tx.currency,
          channel: tx.channel as Transaction['channel'],
          status: mapTransactionStatus(tx.status),
          reference: tx.reference ?? '—',
          groupId: tx.group_id ?? undefined,
        };
      });

      // SMS messages are not currently fetched (table may not exist or not needed)
      // Set empty array for now
      const mappedSms: SmsMessage[] = [];

      setGroupMembers(mappedMembers);
      setGroupMeetings(mappedMeetings);
      setGroupContributions(mappedContributions);
      setGroupTransactions(mappedTransactions);
      setGroupSms(mappedSms);
      setDetailLoading(false);
    };

    loadGroupDetails();
  }, [useMockData, institutionId, selectedGroup?.id]);

  // If a group is selected, show detail view
  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onNavigate={onNavigate}
        members={groupMembers}
        meetings={groupMeetings}
        contributions={groupContributions}
        transactions={groupTransactions}
        sms={groupSms}
        loading={detailLoading}
        error={detailError}
      />
    );
  }

  // Group List View
  return (
    <PageLayout
      title="Groups (Ibimina)"
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Filter size={16} />}
          >
            Filter
          </Button>
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
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Group
          </Button>
        </>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600 text-white p-5 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase">Total Group Funds</p>
              <h3 className="text-2xl font-bold mt-1">{totalGroupFunds.toLocaleString()} RWF</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Briefcase size={20} />
            </div>
          </div>
          <p className="text-sm text-blue-100 mt-2">Across {groups.length} active groups</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase">Meeting Today</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{meetingTodayGroups.length} Groups</h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Expected collection: {expectedCollection.toLocaleString()} RWF
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase">Active Loans</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalActiveLoans}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2">Backed by group funds</p>
        </div>
      </div>

      {/* Groups List */}
      <Section
        title="All Groups"
        headerActions={
          <SearchInput
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            className="w-64"
          />
        }
      >
        {loading && <GroupsSkeleton />}
        {error && <ErrorDisplay error={error} variant="banner" />}
        {!loading && !error && (
          <GroupsList
            groups={groups}
            onSelectGroup={setSelectedGroup}
            searchTerm={searchTerm}
          />
        )}
      </Section>

      {/* Create Group Modal */}
      {institutionId && (
        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
          institutionId={institutionId}
          createGroup={createGroupApi}
        />
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <BulkGroupUpload
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={() => {
            setIsBulkUploadOpen(false);
            refetch();
          }}
        />
      )}
    </PageLayout>
  );
};

export default Groups;
