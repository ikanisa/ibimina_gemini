
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  MoreHorizontal,
  ArrowRight,
  Filter,
  Plus,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Settings,
  LayoutGrid,
  List,
  Check,
  Wallet,
  CreditCard,
  FileText,
  Save,
  Trash2,
  X,
  Upload
} from 'lucide-react';
import { MOCK_GROUPS, MOCK_GROUP_MEMBERS, MOCK_MEETINGS, MOCK_CONTRIBUTIONS, MOCK_TRANSACTIONS, MOCK_SMS } from '../constants';
import BulkGroupUpload from './BulkGroupUpload';
import {
  Contribution,
  Group,
  GroupMember,
  Meeting,
  SmsMessage,
  SupabaseContribution,
  SupabaseGroup,
  SupabaseGroupMember,
  SupabaseMeeting,
  SupabaseMember,
  SupabaseSmsMessage,
  SupabaseTransaction,
  Transaction,
  ViewState
} from '../types';
import { supabase } from '../lib/supabase';
import { mapGroupMemberRole, mapGroupMemberStatus, mapTransactionStatus, mapTransactionType } from '../lib/mappers';
import { useGroups } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { transformGroups } from '../lib/transformers/groupTransformer';
import { validateGroupData } from '../lib/validation';
import { Modal, LoadingSpinner, ErrorDisplay, EmptyState, Button, FormField, SearchInput, Badge } from './ui';

type DetailTab = 'Overview' | 'Members' | 'Contributions' | 'Loans' | 'Meetings' | 'MoMo' | 'Settings';

// Note: mapSupabaseGroupToGroup is replaced by transformGroup from transformers

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
    refetch
  } = useGroups({
    includeMemberCounts: true,
    autoFetch: !useMockData
  });

  // Transform Supabase groups to UI format
  const groups = useMemo(() => {
    if (useMockData) return MOCK_GROUPS;
    if (!supabaseGroups.length) return [];
    return transformGroups(supabaseGroups, memberCounts);
  }, [useMockData, supabaseGroups, memberCounts]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('List');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(useMockData ? MOCK_GROUP_MEMBERS : []);
  const [groupMeetings, setGroupMeetings] = useState<Meeting[]>(useMockData ? MOCK_MEETINGS : []);
  const [groupContributions, setGroupContributions] = useState<Contribution[]>(useMockData ? MOCK_CONTRIBUTIONS : []);
  const [groupTransactions, setGroupTransactions] = useState<Transaction[]>(useMockData ? MOCK_TRANSACTIONS : []);
  const [groupSms, setGroupSms] = useState<SmsMessage[]>(useMockData ? MOCK_SMS : []);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Group Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newGroupData, setNewGroupData] = useState({
    group_name: '',
    meeting_day: 'Monday',
    expected_amount: 5000,
    frequency: 'Weekly' as 'Weekly' | 'Monthly',
    cycle_label: ''
  });

  // Bulk Upload Modal State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Handle Create Group with validation
  const handleCreateGroup = async () => {
    if (!institutionId) {
      setFormErrors({ submit: 'No institution selected' });
      return;
    }

    // Validate using validation utility
    const validation = validateGroupData(newGroupData);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      await createGroupApi({
        institution_id: institutionId,
        group_name: newGroupData.group_name.trim(),
        meeting_day: newGroupData.meeting_day,
        expected_amount: newGroupData.expected_amount,
        frequency: newGroupData.frequency,
        cycle_label: newGroupData.cycle_label || `Cycle ${new Date().getFullYear()}`,
        status: 'ACTIVE'
      });

      // Reset form and close modal
      setNewGroupData({
        group_name: '',
        meeting_day: 'Monday',
        expected_amount: 5000,
        frequency: 'Weekly',
        cycle_label: ''
      });
      setIsCreateModalOpen(false);
      // Hook automatically updates the groups list
    } catch (err) {
      setFormErrors({ 
        submit: err instanceof Error ? err.message : 'Failed to create group' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter groups based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGroupFunds = groups.reduce((sum, group) => sum + group.fundBalance, 0);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const meetingTodayGroups = groups.filter((group) =>
    group.meetingDay.toLowerCase().startsWith(todayName.toLowerCase())
  );
  const expectedCollection = meetingTodayGroups.reduce(
    (sum, group) => sum + group.contributionAmount * group.memberCount,
    0
  );
  const totalActiveLoans = groups.reduce((sum, group) => sum + group.activeLoansCount, 0);

  // Contribution View State
  const [contributionViewMode, setContributionViewMode] = useState<'Matrix' | 'Period'>('Matrix');
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number>(42);

  // Reset period index when group changes
  useEffect(() => {
    if (selectedGroup) {
      if (selectedGroup.contributionFrequency === 'Monthly') {
        setCurrentPeriodIndex(10); // Default to October for demo
      } else {
        setCurrentPeriodIndex(42); // Default to Week 42 for demo
      }
    }
  }, [selectedGroup]);

  const getPeriodLabel = (index: number, frequency: string) => {
    if (frequency === 'Monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = Math.max(0, (index - 1) % 12);
      return months[monthIndex];
    }
    return `Wk ${index}`;
  };

  const currentPeriodLabel = selectedGroup ? getPeriodLabel(currentPeriodIndex, selectedGroup.contributionFrequency) : '';

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
        membersResponse,
        meetingsResponse,
        contributionsResponse,
        transactionsResponse,
        smsResponse
      ] = await Promise.all([
        supabase
          .from('group_members')
          .select('id, member_id, role, status, joined_date, members(full_name)')
          .eq('group_id', selectedGroup.id),
        supabase
          .from('meetings')
          .select('*')
          .eq('group_id', selectedGroup.id)
          .order('date', { ascending: false }),
        supabase
          .from('contributions')
          .select('*')
          .eq('group_id', selectedGroup.id)
          .order('date', { ascending: false }),
        supabase
          .from('transactions')
          .select('*, members(full_name)')
          .eq('group_id', selectedGroup.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('sms_messages')
          .select('*')
          .eq('institution_id', institutionId)
          .order('timestamp', { ascending: false })
      ]);

      const responses = [membersResponse, meetingsResponse, contributionsResponse, transactionsResponse, smsResponse];
      const firstError = responses.find((res) => res.error)?.error;
      if (firstError) {
        console.error('Error loading group details:', firstError);
        setDetailError('Unable to load group details. Check your connection and permissions.');
      }

      const contributions = (contributionsResponse.data as SupabaseContribution[] | null) ?? [];
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
          meetingId: contribution.meeting_id ?? '',
          periodLabel: buildPeriodLabel(contribution.date, selectedGroup.contributionFrequency),
          expectedAmount,
          paidAmount,
          status,
          channel
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
          contributionsMissed: stats.missed
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
        status: meeting.status === 'COMPLETED' ? 'Completed' : 'Scheduled'
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
          groupId: tx.group_id ?? undefined
        };
      });

      const mappedSms: SmsMessage[] = (
        (smsResponse.data as SupabaseSmsMessage[] | null) ?? []
      ).map((sms) => ({
        id: sms.id,
        sender: sms.sender,
        timestamp: new Date(sms.timestamp).toLocaleString(),
        body: sms.body,
        isParsed: sms.is_parsed,
        parsedData: sms.is_parsed
          ? {
            amount: Number(sms.parsed_amount ?? 0),
            currency: sms.parsed_currency ?? 'RWF',
            transactionId: sms.parsed_transaction_id ?? '',
            counterparty: sms.parsed_counterparty ?? ''
          }
          : undefined,
        linkedTransactionId: sms.linked_transaction_id ?? undefined
      }));

      setGroupMembers(mappedMembers);
      setGroupMeetings(mappedMeetings);
      setGroupContributions(mappedContributions);
      setGroupTransactions(mappedTransactions);
      setGroupSms(mappedSms);
      setDetailLoading(false);
    };

    loadGroupDetails();
  }, [useMockData, institutionId, selectedGroup?.id]);

  // Group List View
  if (!selectedGroup) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg shadow-blue-200">
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

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase">Meeting Today</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{meetingTodayGroups.length} Groups</h3>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Calendar size={20} />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Expected collection: {expectedCollection.toLocaleString()} RWF</p>
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <h2 className="font-bold text-slate-800 whitespace-nowrap">All Groups</h2>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="relative w-full sm:w-64">
              <SearchInput
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
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
          </div>
        </div>

        {/* Loading State with Skeleton */}
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="animate-in fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse" />
                      <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-20 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <ErrorDisplay error={error} variant="banner" />
        )}

        {/* Groups Table */}
        {!loading && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Group Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cycle</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Meeting Day</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Fund Balance</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.map((group) => (
                  <tr
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className="hover:bg-blue-50/50 active:bg-blue-100 transition-all duration-150 cursor-pointer group touch-manipulation"
                  >
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {group.cycleLabel}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <Calendar size={12} />
                        {group.meetingDay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                        ))}
                        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600">
                          +{Math.max(group.memberCount - 3, 0)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">{group.fundBalance.toLocaleString()} RWF</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${group.status === 'Active' ? 'bg-green-50 text-green-700' :
                        group.status === 'Suspended' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${group.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {group.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400 group-hover:text-blue-600">
                      <ChevronRight size={20} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredGroups.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                <p>No groups found</p>
              </div>
            )}
          </div>
        )}

        {/* Create Group Modal - Using new Modal component */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setFormErrors({});
            setNewGroupData({
              group_name: '',
              meeting_day: 'Monday',
              expected_amount: 5000,
              frequency: 'Weekly',
              cycle_label: ''
            });
          }}
          title="Create New Group"
          size="md"
        >
          <div className="p-6 space-y-4">
            {formErrors.submit && (
              <ErrorDisplay error={formErrors.submit} variant="inline" />
            )}

            <FormField 
              label="Group Name" 
              required 
              error={formErrors.group_name}
            >
              <input
                type="text"
                value={newGroupData.group_name}
                onChange={(e) => setNewGroupData({ ...newGroupData, group_name: e.target.value })}
                placeholder="e.g., Ibimina y'Urubyiruko"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField 
                label="Meeting Day" 
                error={formErrors.meeting_day}
              >
                <select
                  value={newGroupData.meeting_day}
                  onChange={(e) => setNewGroupData({ ...newGroupData, meeting_day: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </FormField>
              <FormField 
                label="Frequency" 
                error={formErrors.frequency}
              >
                <select
                  value={newGroupData.frequency}
                  onChange={(e) => setNewGroupData({ ...newGroupData, frequency: e.target.value as 'Weekly' | 'Monthly' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </FormField>
            </div>

            <FormField 
              label="Contribution Amount (RWF)" 
              error={formErrors.expected_amount}
            >
              <input
                type="number"
                value={newGroupData.expected_amount}
                onChange={(e) => setNewGroupData({ ...newGroupData, expected_amount: Number(e.target.value) })}
                placeholder="5000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>

            <FormField 
              label="Cycle Label (optional)" 
              error={formErrors.cycle_label}
            >
              <input
                type="text"
                value={newGroupData.cycle_label}
                onChange={(e) => setNewGroupData({ ...newGroupData, cycle_label: e.target.value })}
                placeholder="e.g., Cycle 2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormErrors({});
                setNewGroupData({
                  group_name: '',
                  meeting_day: 'Monday',
                  expected_amount: 5000,
                  frequency: 'Weekly',
                  cycle_label: ''
                });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateGroup}
              isLoading={isSubmitting}
              leftIcon={<Plus size={16} />}
            >
              Create Group
            </Button>
          </div>
        </Modal>

        {/* Bulk Upload Modal */}
        {isBulkUploadOpen && (
          <BulkGroupUpload
            onClose={() => setIsBulkUploadOpen(false)}
            onSuccess={() => {
              setIsBulkUploadOpen(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    );
  }

  // Group Detail View (The "Brain")
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Detail Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-white">
        <button
          onClick={() => setSelectedGroup(null)}
          className="text-xs text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1 font-medium"
        >
          <ArrowRight size={12} className="rotate-180" /> Back to Groups
        </button>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-200">
              {selectedGroup.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{selectedGroup.name}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-600">{selectedGroup.code}</span>
                <span className="flex items-center gap-1"><Users size={14} /> {selectedGroup.memberCount} Members</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {selectedGroup.meetingDay}s</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-semibold">Group Fund Balance</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{selectedGroup.fundBalance.toLocaleString()} <span className="text-lg text-slate-400 font-normal">RWF</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-8 border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'Overview', icon: Briefcase },
            { id: 'Members', icon: Users },
            { id: 'Contributions', icon: DollarSign },
            { id: 'Loans', icon: CheckCircle2 },
            { id: 'Meetings', icon: Calendar },
            { id: 'MoMo', icon: Smartphone },
            { id: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'
                }`}
            >
              <tab.icon size={16} />
              {tab.id}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {detailError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {detailError}
          </div>
        )}
        {detailLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Main Overview Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Contribution Cycle Progress</h3>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">{selectedGroup.cycleLabel}</span>
                    <span className="text-blue-600 font-bold">84% Completed</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full w-[84%]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Expected / Meeting</p>
                    <p className="text-lg font-bold text-slate-900">{((selectedGroup.contributionAmount * selectedGroup.memberCount)).toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Arrears Total</p>
                    <p className="text-lg font-bold text-red-600">45,000 RWF</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Next Meeting</p>
                    <p className="text-lg font-bold text-slate-900">{selectedGroup.nextMeeting}</p>
                  </div>
                </div>
              </div>

              {/* Recent Meetings List Preview */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Recent Meetings</h3>
                  <button
                    onClick={() => setActiveTab('Meetings')}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {groupMeetings.filter(m => m.groupId === selectedGroup.id).slice(0, 3).map(meeting => (
                    <div key={meeting.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-center bg-slate-100 rounded-lg py-1">
                          <span className="block text-xs text-slate-500 font-bold uppercase">{meeting.date.split('-')[1]}</span>
                          <span className="block text-lg font-bold text-slate-900">{meeting.date.split('-')[2]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{meeting.type} Meeting</p>
                          <p className="text-xs text-slate-500">{meeting.attendanceCount} Members attended</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">+{meeting.totalCollected.toLocaleString()} RWF</p>
                        <p className="text-xs text-slate-400">{meeting.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Alerts & Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    <Calendar size={18} /> Start New Meeting
                  </button>
                  <button
                    onClick={() => setActiveTab('Loans')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                  >
                    <DollarSign size={18} /> Disburse Group Loan
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate(ViewState.MEMBERS);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                  >
                    <Users size={18} /> Add Member
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} /> Attention Needed
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-xs text-amber-900">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                    Member Divine Keza has missed 3 consecutive contributions.
                  </li>
                  <li className="flex items-start gap-2 text-xs text-amber-900">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                    Loan Repayment for Grace U. is 2 days overdue.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Contributions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-slate-800">Contributions</h3>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setContributionViewMode('Matrix')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${contributionViewMode === 'Matrix' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <LayoutGrid size={14} /> Cycle Matrix
                  </button>
                  <button
                    onClick={() => setContributionViewMode('Period')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${contributionViewMode === 'Period' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <List size={14} /> Period Detail
                  </button>
                </div>
              </div>

              {contributionViewMode === 'Period' && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                  <button
                    onClick={() => setCurrentPeriodIndex(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-slate-700 w-24 text-center">{currentPeriodLabel}</span>
                  <button
                    onClick={() => setCurrentPeriodIndex(prev => prev + 1)}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {contributionViewMode === 'Matrix' ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800">Contribution Matrix</h3>
                    <p className="text-xs text-slate-500">Cycle View: {selectedGroup.cycleLabel}</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <span className="w-3 h-3 bg-green-500 rounded-sm"></span> Paid
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Missed
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <span className="w-3 h-3 bg-slate-200 rounded-sm"></span> Future
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 bg-slate-50 border-b border-r border-slate-200 sticky left-0 w-48">Member</th>
                        {[40, 41, 42, 43, 44, 45].map(idx => {
                          const label = getPeriodLabel(idx, selectedGroup.contributionFrequency);
                          return (
                            <th key={idx} className="p-2 text-center text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200 min-w-[60px]">
                              {label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {groupMembers.map((member) => (
                        <tr key={member.memberId} className="hover:bg-slate-50">
                          <td className="p-3 text-sm font-medium text-slate-900 border-r border-slate-100 bg-white sticky left-0">
                            {member.name}
                          </td>
                          {[40, 41, 42, 43, 44, 45].map(week => {
                            const isPast = week <= 42;
                            const label = getPeriodLabel(week, selectedGroup.contributionFrequency);
                            // Simulated status logic for demonstration
                            // Using simple string matching since mock data uses "Wk 42" format
                            const contribution = groupContributions.find(c =>
                              c.memberId === member.memberId &&
                              c.periodLabel === label &&
                              c.groupId === selectedGroup.id
                            );

                            let status = 'Future';
                            // Fallback for demo purposes if exact label match fails in mock data
                            if (isPast) status = contribution?.status || (Math.random() > 0.2 ? 'Paid' : 'Missed');

                            return (
                              <td key={week} className="p-2 text-center border border-slate-50">
                                {status === 'Future' ? (
                                  <div className="w-8 h-8 mx-auto rounded bg-slate-100"></div>
                                ) : (
                                  <div
                                    className={`w-8 h-8 mx-auto rounded flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:opacity-80 ${status === 'Paid' ? 'bg-green-500' : 'bg-red-500'}`}
                                    title={`${label}: ${status}`}
                                  >
                                    {status === 'Paid' ? 'P' : 'M'}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-3">Member</div>
                  <div className="col-span-2 text-right">Expected</div>
                  <div className="col-span-2 text-right">Paid</div>
                  <div className="col-span-2 text-center">Channel</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100">
                  {groupMembers.map((member) => {
                    // Find mock contribution for selected period
                    const contribution = groupContributions.find(c =>
                      c.memberId === member.memberId &&
                      c.periodLabel === currentPeriodLabel &&
                      c.groupId === selectedGroup.id
                    );

                    const status = contribution?.status || 'Pending';
                    const isPaid = status === 'Paid';

                    return (
                      <div key={member.memberId} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-3">
                          <p className="text-sm font-medium text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.role}</p>
                        </div>
                        <div className="col-span-2 text-right text-sm text-slate-600">
                          {selectedGroup.contributionAmount.toLocaleString()} RWF
                        </div>
                        <div className="col-span-2 text-right">
                          <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-slate-400'}`}>
                            {contribution?.paidAmount ? contribution.paidAmount.toLocaleString() : 0} RWF
                          </span>
                        </div>
                        <div className="col-span-2 text-center">
                          {contribution?.channel ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-700">
                              {contribution.channel === 'MoMo' && <Smartphone size={10} />}
                              {contribution.channel === 'Cash' && <DollarSign size={10} />}
                              {contribution.channel === 'Token' && <Wallet size={10} />}
                              {contribution.channel}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </div>
                        <div className="col-span-1 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border ${status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' :
                            status === 'Missed' ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {status === 'Paid' && <Check size={10} className="mr-1" />}
                            {status}
                          </span>
                        </div>
                        <div className="col-span-2 text-right flex justify-end gap-2">
                          {!isPaid && (
                            <>
                              <button
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded border border-green-200 bg-white transition-colors"
                                title="Mark Paid (Cash)"
                              >
                                <DollarSign size={16} />
                              </button>
                              <button
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 bg-white transition-colors"
                                title="Verify MoMo"
                              >
                                <Smartphone size={16} />
                              </button>
                            </>
                          )}
                          {isPaid && (
                            <button className="text-xs text-blue-600 hover:underline">Edit</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Members' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Group Roster</h3>
              <button
                onClick={() => {
                  if (onNavigate) onNavigate(ViewState.MEMBERS);
                }}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Full Member Database
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Performance</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupMembers.map((member) => (
                  <tr key={member.memberId} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.memberId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded border ${member.role === 'Chairperson' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        member.role === 'Treasurer' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.joinedDate}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex gap-1 text-xs mb-1">
                          <span className="text-green-600 font-bold">{member.contributionsPaid}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-red-500 font-bold">{member.contributionsMissed}</span>
                        </div>
                        <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${member.contributionsMissed > 2 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${(member.contributionsPaid / (member.contributionsPaid + member.contributionsMissed)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Loans' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Group-Backed Loans</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <Plus size={16} /> New Loan
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Loan ID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Borrower</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Guarantee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">L-2201</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">Grace Uwase</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">150,000 RWF</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">Active</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">Group Fund (100%)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">L-2155</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">Divine Keza</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">500,000 RWF</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">Overdue</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">Co-Guarantors (3)</td>
                  </tr>
                </tbody>
              </table>
              <div className="p-6 text-center border-t border-slate-100">
                <p className="text-sm text-slate-500">Showing 2 of 2 active group loans</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Meetings' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Meeting Log</h3>
              <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                <Calendar size={16} /> Schedule Meeting
              </button>
            </div>

            <div className="grid gap-4">
              {groupMeetings.filter(m => m.groupId === selectedGroup.id).map(meeting => (
                <div key={meeting.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${meeting.status === 'Completed' ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                        <span className="text-xs font-bold uppercase">{meeting.date.split('-')[1]}</span>
                        <span className="text-xl font-bold">{meeting.date.split('-')[2]}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{meeting.type} Meeting</h4>
                        <p className="text-sm text-slate-500 mt-1">{meeting.notes || 'No notes recorded.'}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Users size={12} /> {meeting.attendanceCount} Attended</span>
                          <span className="flex items-center gap-1"><DollarSign size={12} /> {meeting.totalCollected.toLocaleString()} RWF Collected</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${meeting.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'MoMo' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Group Mobile Money Hub</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Showing MoMo transactions and SMS logs likely related to <strong>{selectedGroup.name}</strong>.
                  AI matches based on member phone numbers and contribution amounts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="font-bold text-slate-700 text-sm">Unlinked SMS (Suggestions)</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {groupSms.filter(sms => !sms.linkedTransactionId).map(sms => (
                    <div key={sms.id} className="p-4 hover:bg-slate-50">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900">{sms.sender}</span>
                        <span className="text-xs text-slate-400">{sms.timestamp.split(' ')[1]}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-2">{sms.body}</p>
                      {sms.parsedData && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono bg-slate-100 px-1.5 rounded text-slate-600">
                            {sms.parsedData.amount.toLocaleString()} {sms.parsedData.currency}
                          </span>
                          <button className="text-xs text-blue-600 font-medium hover:underline">Link to Member</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {groupSms.filter(sms => !sms.linkedTransactionId).length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">No unmatched SMS found.</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="font-bold text-slate-700 text-sm">Confirmed Transactions</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {groupTransactions.filter(tx => tx.groupId === selectedGroup.id).map(tx => (
                    <div key={tx.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{tx.memberName}</p>
                        <p className="text-xs text-slate-500">{tx.channel} • {tx.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">+{tx.amount.toLocaleString()} RWF</p>
                        <span className="text-[10px] text-slate-400">{tx.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Group Configuration</h3>
              <p className="text-sm text-slate-500">Manage rules, cycle parameters, and penalties.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Group Name</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" defaultValue={selectedGroup.name} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cycle Label</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" defaultValue={selectedGroup.cycleLabel} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm mb-4">Contribution Rules</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount per Member</label>
                    <div className="relative">
                      <input type="number" className="w-full p-2 border border-slate-300 rounded-lg text-sm" defaultValue={selectedGroup.contributionAmount} />
                      <span className="absolute right-3 top-2 text-xs text-slate-400">RWF</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Frequency</label>
                    <select className="w-full p-2 border border-slate-300 rounded-lg text-sm" defaultValue={selectedGroup.contributionFrequency}>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button className="flex items-center gap-2 text-red-600 text-sm font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                  <Trash2 size={16} /> Archive Group
                </button>
                <button className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
