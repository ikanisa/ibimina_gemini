/**
 * Groups Component (Refactored)
 * Main container for groups management
 * Uses modular components from components/groups/
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Filter,
  Plus,
  Upload,
  Users,
  ArrowUpDown,
  ChevronDown,
  PiggyBank,
  Repeat,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import BulkGroupUpload from './BulkGroupUpload';
import {
  Contribution,
  Group,
  GroupMember,
  SmsMessage,
  SupabaseGroupMember,
  SupabaseMember,
  SupabaseTransaction,
  Transaction,
  ViewState,
} from '@/core/types';
import { supabase } from '@/lib/supabase';
import { mapGroupMemberRole, mapGroupMemberStatus, mapTransactionStatus, mapTransactionType } from '@/lib/mappers';
import { useGroups } from '@/hooks';
import { useAuth } from '@/core/auth';
import { transformGroups } from '@/lib/transformers/groupTransformer';
import { PageLayout, Section } from '@/shared/components/layout';
import { Button, SearchInput, ErrorDisplay } from '@/shared/components/ui';
import { GroupsList } from './GroupsList';
import { GroupDetail } from './GroupDetail';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupsSkeleton } from '@/shared/components/ui/PageSkeletons';

interface GroupsProps {
  onNavigate?: (view: ViewState) => void;
  institutionId?: string | null;
}

type FilterStatus = 'all' | 'Active' | 'Suspended' | 'Completed';
type FrequencyFilter = 'all' | 'Weekly' | 'Monthly';
type SmartFilter =
  | 'all'
  | 'high-savings'
  | 'low-savings'
  | 'large-groups'
  | 'small-groups'
  | 'active-loans'
  | 'no-loans';
type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'balance-high'
  | 'balance-low'
  | 'members-high'
  | 'members-low'
  | 'loans-high'
  | 'loans-low'
  | 'savings-per-member-high'
  | 'savings-per-member-low';

const Groups: React.FC<GroupsProps> = ({ onNavigate, institutionId: institutionIdProp }) => {
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
    autoFetch: true,
  });

  // Transform Supabase groups to UI format
  const groups = useMemo(() => {
    if (!supabaseGroups.length) return [];
    return transformGroups(supabaseGroups, memberCounts);
  }, [supabaseGroups, memberCounts]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupContributions, setGroupContributions] = useState<Contribution[]>([]);
  const [groupTransactions, setGroupTransactions] = useState<Transaction[]>([]);
  const [groupSms, setGroupSms] = useState<SmsMessage[]>([]);

  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>('all');
  const [smartFilter, setSmartFilter] = useState<SmartFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showFrequencyMenu, setShowFrequencyMenu] = useState(false);
  const [showSmartMenu, setShowSmartMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Create Group Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Calculate stats for header (memoized)
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const activeGroups = groups.filter(g => g.status === 'Active').length;
    const totalSavings = groups.reduce((sum, group) => sum + group.fundBalance, 0);
    const totalMembers = groups.reduce((sum, group) => sum + group.memberCount, 0);

    return {
      totalGroups,
      activeGroups,
      totalSavings,
      totalMembers,
    };
  }, [groups]);

  const { medianSavings, medianMembers } = useMemo(() => {
    const median = (values: number[]) => {
      if (!values.length) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
      }
      return sorted[mid];
    };

    const savingsValues = groups.map(group => group.fundBalance);
    const memberValues = groups.map(group => group.memberCount);

    return {
      medianSavings: median(savingsValues),
      medianMembers: median(memberValues),
    };
  }, [groups]);

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} RWF`;
  const getSavingsPerMember = useCallback(
    (group: Group) => (group.memberCount > 0 ? group.fundBalance / group.memberCount : 0),
    []
  );

  const hasActiveFilters =
    filterStatus !== 'all' ||
    frequencyFilter !== 'all' ||
    smartFilter !== 'all' ||
    searchTerm.length > 0;

  const medianSavingsLabel = formatCurrency(Math.round(medianSavings));
  const medianMembersLabel = Math.round(medianMembers);
  const smartFilterButtonLabels: Record<SmartFilter, string> = {
    all: 'Smart',
    'high-savings': 'High Savings',
    'low-savings': 'Low Savings',
    'large-groups': 'Large Groups',
    'small-groups': 'Small Groups',
    'active-loans': 'Active Loans',
    'no-loans': 'No Loans',
  };

  // Filter and sort groups
  const filteredAndSortedGroups = useMemo(() => {
    let result = [...groups];

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(g => g.status === filterStatus);
    }

    // Apply contribution frequency filter
    if (frequencyFilter !== 'all') {
      result = result.filter(g => g.contributionFrequency === frequencyFilter);
    }

    // Apply smart filters
    switch (smartFilter) {
      case 'high-savings':
        result = result.filter(g => g.fundBalance >= medianSavings);
        break;
      case 'low-savings':
        result = result.filter(g => g.fundBalance < medianSavings);
        break;
      case 'large-groups':
        result = result.filter(g => g.memberCount >= medianMembers);
        break;
      case 'small-groups':
        result = result.filter(g => g.memberCount < medianMembers);
        break;
      case 'active-loans':
        result = result.filter(g => g.activeLoansCount > 0);
        break;
      case 'no-loans':
        result = result.filter(g => g.activeLoansCount === 0);
        break;
      default:
        break;
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(term) ||
        g.code.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'balance-high':
        result.sort((a, b) => b.fundBalance - a.fundBalance);
        break;
      case 'balance-low':
        result.sort((a, b) => a.fundBalance - b.fundBalance);
        break;
      case 'members-high':
        result.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'members-low':
        result.sort((a, b) => a.memberCount - b.memberCount);
        break;
      case 'loans-high':
        result.sort((a, b) => b.activeLoansCount - a.activeLoansCount);
        break;
      case 'loans-low':
        result.sort((a, b) => a.activeLoansCount - b.activeLoansCount);
        break;
      case 'savings-per-member-high':
        result.sort((a, b) => getSavingsPerMember(b) - getSavingsPerMember(a));
        break;
      case 'savings-per-member-low':
        result.sort((a, b) => getSavingsPerMember(a) - getSavingsPerMember(b));
        break;
    }

    return result;
  }, [
    groups,
    filterStatus,
    frequencyFilter,
    smartFilter,
    searchTerm,
    sortBy,
    medianSavings,
    medianMembers,
    getSavingsPerMember,
  ]);

  // Load group details when a group is selected
  useEffect(() => {
    if (!selectedGroup || !institutionId) {
      setGroupMembers([]);
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
          .select('*, members:members!transactions_member_id_fkey(full_name)')
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
            : channelValue.includes('cash')
              ? 'Cash'
              : 'MoMo';

        return {
          id: contribution.id,
          memberId: contribution.member_id,
          groupId: contribution.group_id,
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
      const mappedSms: SmsMessage[] = [];

      setGroupMembers(mappedMembers);
      setGroupContributions(mappedContributions);
      setGroupTransactions(mappedTransactions);
      setGroupSms(mappedSms);
      setDetailLoading(false);
    };

    loadGroupDetails();
  }, [institutionId, selectedGroup?.id]);

  // If a group is selected, show detail view
  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onNavigate={onNavigate}
        members={groupMembers}
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
              <p className="text-blue-100 text-xs font-semibold uppercase">Total Groups</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalGroups}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Briefcase size={20} />
            </div>
          </div>
          <p className="text-sm text-blue-100 mt-2">{stats.activeGroups} active groups</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-slate-200 dark:border-neutral-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-neutral-400 text-xs font-semibold uppercase">Total Savings</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1">{stats.totalSavings.toLocaleString()} RWF</h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <PiggyBank size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">Combined group funds</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-slate-200 dark:border-neutral-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-neutral-400 text-xs font-semibold uppercase">Total Members</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1">{stats.totalMembers}</h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">Across all groups</p>
        </div>
      </div>

      {/* Groups List */}
      <Section
        title="All Groups"
        headerActions={
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Filter size={14} />}
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu);
                  setShowFrequencyMenu(false);
                  setShowSmartMenu(false);
                  setShowSortMenu(false);
                }}
              >
                {filterStatus === 'all' ? 'Status' : filterStatus}
                <ChevronDown size={14} className="ml-1" />
              </Button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                  {(['all', 'Active', 'Suspended', 'Completed'] as FilterStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 first:rounded-t-lg last:rounded-b-lg ${filterStatus === status ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-neutral-300'
                        }`}
                    >
                      {status === 'all' ? 'All Statuses' : status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Frequency Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Repeat size={14} />}
                onClick={() => {
                  setShowFrequencyMenu(!showFrequencyMenu);
                  setShowFilterMenu(false);
                  setShowSmartMenu(false);
                  setShowSortMenu(false);
                }}
              >
                {frequencyFilter === 'all' ? 'Frequency' : frequencyFilter}
                <ChevronDown size={14} className="ml-1" />
              </Button>
              {showFrequencyMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                  {(['all', 'Weekly', 'Monthly'] as FrequencyFilter[]).map((frequency) => (
                    <button
                      key={frequency}
                      onClick={() => {
                        setFrequencyFilter(frequency);
                        setShowFrequencyMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 first:rounded-t-lg last:rounded-b-lg ${frequencyFilter === frequency ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-neutral-300'
                        }`}
                    >
                      {frequency === 'all' ? 'All Frequencies' : frequency}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Filter Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<SlidersHorizontal size={14} />}
                onClick={() => {
                  setShowSmartMenu(!showSmartMenu);
                  setShowFilterMenu(false);
                  setShowFrequencyMenu(false);
                  setShowSortMenu(false);
                }}
              >
                {smartFilterButtonLabels[smartFilter]}
                <ChevronDown size={14} className="ml-1" />
              </Button>
              {showSmartMenu && (
                <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                  {([
                    { value: 'all', label: 'All Groups' },
                    { value: 'high-savings', label: `High Savings (>= ${medianSavingsLabel})` },
                    { value: 'low-savings', label: `Low Savings (< ${medianSavingsLabel})` },
                    { value: 'large-groups', label: `Large Groups (>= ${medianMembersLabel} members)` },
                    { value: 'small-groups', label: `Small Groups (< ${medianMembersLabel} members)` },
                    { value: 'active-loans', label: 'Active Loans' },
                    { value: 'no-loans', label: 'No Active Loans' },
                  ] as { value: SmartFilter; label: string }[]).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSmartFilter(option.value);
                        setShowSmartMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 first:rounded-t-lg last:rounded-b-lg ${smartFilter === option.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-neutral-300'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowUpDown size={14} />}
                onClick={() => {
                  setShowSortMenu(!showSortMenu);
                  setShowFilterMenu(false);
                  setShowFrequencyMenu(false);
                  setShowSmartMenu(false);
                }}
              >
                Sort
                <ChevronDown size={14} className="ml-1" />
              </Button>
              {showSortMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                  {[
                    { value: 'name-asc', label: 'Name (A-Z)' },
                    { value: 'name-desc', label: 'Name (Z-A)' },
                    { value: 'balance-high', label: 'Balance (High-Low)' },
                    { value: 'balance-low', label: 'Balance (Low-High)' },
                    { value: 'members-high', label: 'Members (High-Low)' },
                    { value: 'members-low', label: 'Members (Low-High)' },
                    { value: 'loans-high', label: 'Active Loans (High-Low)' },
                    { value: 'loans-low', label: 'Active Loans (Low-High)' },
                    { value: 'savings-per-member-high', label: 'Savings/Member (High-Low)' },
                    { value: 'savings-per-member-low', label: 'Savings/Member (Low-High)' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value as SortOption);
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 first:rounded-t-lg last:rounded-b-lg ${sortBy === option.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-neutral-300'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<X size={14} />}
                onClick={() => {
                  setFilterStatus('all');
                  setFrequencyFilter('all');
                  setSmartFilter('all');
                  setSearchTerm('');
                }}
              >
                Reset
              </Button>
            )}

            <SearchInput
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              className="w-64"
            />
          </div>
        }
      >
        {loading && <GroupsSkeleton />}
        {error && <ErrorDisplay error={error} variant="banner" onRetry={refetch} />}
        {!loading && !error && filteredAndSortedGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 p-4 bg-slate-100 dark:bg-neutral-700 rounded-full">
              <Briefcase size={48} className="text-slate-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-2">
              {groups.length === 0 ? 'No groups yet' : 'No groups match your filters'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-md mb-4">
              {groups.length === 0
                ? 'Create your first savings group to start managing contributions.'
                : 'Try adjusting your filters or search term.'}
            </p>
            {groups.length === 0 && (
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create First Group
              </Button>
            )}
          </div>
        )}
        {!loading && !error && filteredAndSortedGroups.length > 0 && (
          <GroupsList
            groups={filteredAndSortedGroups}
            onSelectGroup={setSelectedGroup}
            searchTerm=""
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
