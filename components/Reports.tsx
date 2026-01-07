import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, Users, User, Calendar, Filter, 
  TrendingUp, Wallet, AlertCircle, UserCheck, Briefcase,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button, SearchInput, Badge } from './ui';
import { 
  ReportKpiCard, 
  BreakdownTable, 
  ReportLedgerTable,
  CsvExport,
  objectsToCsv,
  generateReportFilename
} from './reports/index';

type ReportScope = 'institution' | 'group' | 'member';
type StatusFilter = 'all' | 'allocated' | 'unallocated' | 'error' | 'duplicate';

interface ReportSummary {
  kpis: Record<string, number | string | null>;
  breakdown: Array<{
    group_id?: string;
    member_id?: string;
    group_name?: string;
    group_code?: string;
    member_name?: string;
    member_code?: string;
    transaction_count: number;
    total_received?: number;
    total_contributed?: number;
    allocated_amount?: number;
    unallocated_count?: number;
  }>;
}

interface LedgerRow {
  id: string;
  occurred_at: string;
  amount: number;
  currency?: string;
  allocation_status: string;
  momo_ref?: string;
  payer_phone?: string;
  payer_name?: string;
  member_name?: string;
  member_code?: string;
  group_name?: string;
  group_code?: string;
}

interface GroupOption {
  id: string;
  group_name: string;
  group_code?: string;
}

interface MemberOption {
  id: string;
  full_name: string;
  member_code?: string;
  phone?: string;
}

const LEDGER_PAGE_SIZE = 50;

const Reports: React.FC = () => {
  const { institutionId, role } = useAuth();
  const isPlatformAdmin = role === 'PLATFORM_ADMIN';

  // Scope state
  const [scope, setScope] = useState<ReportScope>('institution');
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [scopeName, setScopeName] = useState<string>('');

  // Filter state
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Picker state
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Data state
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load groups/members for pickers
  useEffect(() => {
    if (!institutionId) return;

    const loadGroups = async () => {
      const { data } = await supabase
        .from('groups')
        .select('id, group_name, group_code')
        .eq('institution_id', institutionId)
        .order('group_name');
      
      if (data) setGroups(data);
    };

    const loadMembers = async () => {
      const { data } = await supabase
        .from('members')
        .select('id, full_name, member_code, phone')
        .eq('institution_id', institutionId)
        .order('full_name');
      
      if (data) setMembers(data);
    };

    loadGroups();
    loadMembers();
  }, [institutionId]);

  // Load report data
  const loadReport = useCallback(async () => {
    if (!institutionId && !isPlatformAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const effectiveScopeId = scope === 'institution' 
        ? (isPlatformAdmin ? scopeId : institutionId)
        : scopeId;

      // Load summary
      const { data: summaryData, error: summaryError } = await supabase.rpc('get_report_summary', {
        p_scope: scope,
        p_scope_id: effectiveScopeId,
        p_from: `${dateRange.start}T00:00:00Z`,
        p_to: `${dateRange.end}T23:59:59Z`,
        p_status: statusFilter === 'all' ? null : statusFilter
      });

      if (summaryError) throw summaryError;

      setSummary({
        kpis: summaryData?.kpis || {},
        breakdown: summaryData?.breakdown || []
      });

      // Load ledger (first page)
      const { data: ledgerData, error: ledgerError } = await supabase.rpc('get_report_ledger', {
        p_scope: scope,
        p_scope_id: effectiveScopeId,
        p_from: `${dateRange.start}T00:00:00Z`,
        p_to: `${dateRange.end}T23:59:59Z`,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_limit: LEDGER_PAGE_SIZE,
        p_offset: 0
      });

      if (ledgerError) throw ledgerError;

      setLedger(ledgerData?.rows || []);
      setLedgerTotal(ledgerData?.total_count || 0);

    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [institutionId, isPlatformAdmin, scope, scopeId, dateRange, statusFilter]);

  // Load more ledger rows
  const loadMoreLedger = useCallback(async () => {
    if (loadingMore || ledger.length >= ledgerTotal) return;

    setLoadingMore(true);

    try {
      const effectiveScopeId = scope === 'institution' 
        ? (isPlatformAdmin ? scopeId : institutionId)
        : scopeId;

      const { data, error } = await supabase.rpc('get_report_ledger', {
        p_scope: scope,
        p_scope_id: effectiveScopeId,
        p_from: `${dateRange.start}T00:00:00Z`,
        p_to: `${dateRange.end}T23:59:59Z`,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_limit: LEDGER_PAGE_SIZE,
        p_offset: ledger.length
      });

      if (error) throw error;

      setLedger(prev => [...prev, ...(data?.rows || [])]);
    } catch (err) {
      console.error('Error loading more ledger:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, ledger.length, ledgerTotal, scope, scopeId, institutionId, isPlatformAdmin, dateRange, statusFilter]);

  // Trigger load when filters change
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Handle scope change
  const handleScopeChange = (newScope: ReportScope) => {
    setScope(newScope);
    setScopeId(null);
    setScopeName('');
    setSearchTerm('');
  };

  // Handle group/member selection
  const handleScopeIdChange = (id: string, name: string) => {
    setScopeId(id);
    setScopeName(name);
  };

  // Export CSV
  const handleExportCsv = useCallback(async (): Promise<string> => {
    const effectiveScopeId = scope === 'institution' 
      ? (isPlatformAdmin ? scopeId : institutionId)
      : scopeId;

    // Fetch all ledger data for export (up to 5000 rows)
    const allRows: LedgerRow[] = [];
    let offset = 0;
    const batchSize = 500;
    const maxRows = 5000;

    while (allRows.length < maxRows) {
      const { data, error } = await supabase.rpc('get_report_ledger', {
        p_scope: scope,
        p_scope_id: effectiveScopeId,
        p_from: `${dateRange.start}T00:00:00Z`,
        p_to: `${dateRange.end}T23:59:59Z`,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_limit: batchSize,
        p_offset: offset
      });

      if (error) throw error;
      if (!data?.rows?.length) break;

      allRows.push(...data.rows);
      offset += batchSize;

      if (data.rows.length < batchSize) break;
    }

    // Convert to CSV
    return objectsToCsv(allRows, [
      { key: 'occurred_at', header: 'Date' },
      { key: 'amount', header: 'Amount' },
      { key: 'currency', header: 'Currency' },
      { key: 'allocation_status', header: 'Status' },
      { key: 'payer_phone', header: 'Payer Phone' },
      { key: 'payer_name', header: 'Payer Name' },
      { key: 'momo_ref', header: 'MoMo Ref' },
      { key: 'member_name', header: 'Member' },
      { key: 'member_code', header: 'Member Code' },
      { key: 'group_name', header: 'Group' },
      { key: 'group_code', header: 'Group Code' }
    ]);
  }, [scope, scopeId, institutionId, isPlatformAdmin, dateRange, statusFilter]);

  // Filter groups/members by search
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(g => 
      g.group_name.toLowerCase().includes(term) ||
      g.group_code?.toLowerCase().includes(term)
    );
  }, [groups, searchTerm]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    const term = searchTerm.toLowerCase();
    return members.filter(m => 
      m.full_name.toLowerCase().includes(term) ||
      m.member_code?.toLowerCase().includes(term) ||
      m.phone?.includes(term)
    );
  }, [members, searchTerm]);

  // Breakdown table click handler
  const handleBreakdownClick = (id: string) => {
    if (scope === 'institution') {
      // Drill down to group
      const group = groups.find(g => g.id === id);
      if (group) {
        setScope('group');
        setScopeId(id);
        setScopeName(group.group_name);
      }
    } else if (scope === 'group') {
      // Drill down to member
      const member = members.find(m => m.id === id);
      if (member) {
        setScope('member');
        setScopeId(id);
        setScopeName(member.full_name);
      }
    }
  };

  // Render KPIs based on scope
  const renderKpis = () => {
    if (!summary?.kpis) return null;
    const kpis = summary.kpis;

    if (scope === 'member') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportKpiCard
            label="Total Contributed"
            value={`${(Number(kpis.total_contributed) || 0).toLocaleString()} RWF`}
            icon={<Wallet size={20} />}
            variant="success"
          />
          <ReportKpiCard
            label="Transactions"
            value={Number(kpis.transaction_count) || 0}
            icon={<FileText size={20} />}
          />
          <ReportKpiCard
            label="Last Payment"
            value={kpis.last_payment_date 
              ? new Date(kpis.last_payment_date as string).toLocaleDateString() 
              : '—'}
            icon={<Calendar size={20} />}
          />
          <ReportKpiCard
            label="Avg Amount"
            value={`${Math.round(Number(kpis.avg_amount) || 0).toLocaleString()} RWF`}
            icon={<TrendingUp size={20} />}
          />
        </div>
      );
    }

    if (scope === 'group') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportKpiCard
            label="Total Received"
            value={`${(Number(kpis.total_received) || 0).toLocaleString()} RWF`}
            icon={<Wallet size={20} />}
            variant="success"
          />
          <ReportKpiCard
            label="Allocated Total"
            value={`${(Number(kpis.allocated_total) || 0).toLocaleString()} RWF`}
            icon={<UserCheck size={20} />}
          />
          <ReportKpiCard
            label="Unallocated"
            value={Number(kpis.unallocated_count) || 0}
            icon={<AlertCircle size={20} />}
            variant={Number(kpis.unallocated_count) > 0 ? 'warning' : 'default'}
          />
          <ReportKpiCard
            label="Members"
            value={Number(kpis.member_count) || 0}
            icon={<Users size={20} />}
          />
        </div>
      );
    }

    // Institution scope
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ReportKpiCard
          label="Total Received"
          value={`${(Number(kpis.total_received) || 0).toLocaleString()} RWF`}
          icon={<Wallet size={20} />}
          variant="success"
        />
        <ReportKpiCard
          label="Allocated"
          value={`${(Number(kpis.allocated_total) || 0).toLocaleString()} RWF`}
          icon={<UserCheck size={20} />}
        />
        <ReportKpiCard
          label="Unallocated"
          value={`${(Number(kpis.unallocated_total) || 0).toLocaleString()} RWF`}
          subValue={`${Number(kpis.unallocated_count) || 0} txns`}
          icon={<AlertCircle size={20} />}
          variant={Number(kpis.unallocated_count) > 0 ? 'warning' : 'default'}
        />
        <ReportKpiCard
          label="Parse Errors"
          value={Number(kpis.parse_errors_count) || 0}
          icon={<AlertCircle size={20} />}
          variant={Number(kpis.parse_errors_count) > 0 ? 'danger' : 'default'}
        />
        <ReportKpiCard
          label="Active Groups"
          value={Number(kpis.active_groups_count) || 0}
          icon={<Briefcase size={20} />}
        />
        <ReportKpiCard
          label="Active Members"
          value={Number(kpis.active_members_count) || 0}
          icon={<Users size={20} />}
        />
      </div>
    );
  };

  // Render breakdown table
  const renderBreakdown = () => {
    if (!summary?.breakdown || scope === 'member') return null;

    const rows = summary.breakdown.map(row => ({
      id: row.group_id || row.member_id || '',
      name: row.group_name || row.member_name || 'Unknown',
      code: row.group_code || row.member_code,
      transactionCount: row.transaction_count || 0,
      totalAmount: row.total_received || row.total_contributed || 0,
      unallocatedCount: row.unallocated_count
    }));

    const title = scope === 'institution' ? 'Breakdown by Group' : 'Breakdown by Member';

    return (
      <BreakdownTable
        title={title}
        rows={rows}
        onRowClick={handleBreakdownClick}
        emptyMessage={`No ${scope === 'institution' ? 'groups' : 'members'} found`}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          {scopeName && (
            <p className="text-sm text-slate-500">
              {scope === 'group' ? 'Group' : scope === 'member' ? 'Member' : 'Institution'}: {scopeName}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <CsvExport
            onExport={handleExportCsv}
            filename={generateReportFilename(scope, scopeName)}
            disabled={loading}
          />
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            leftIcon={<Filter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {/* Scope Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleScopeChange('institution')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              scope === 'institution'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 size={16} />
            Institution
          </button>
          <button
            onClick={() => handleScopeChange('group')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              scope === 'group'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase size={16} />
            Group
          </button>
          <button
            onClick={() => handleScopeChange('member')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              scope === 'member'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User size={16} />
            Member
          </button>
        </div>

        {/* Group/Member Picker */}
        {(scope === 'group' || scope === 'member') && (
          <div className="space-y-2">
            <SearchInput
              placeholder={`Search ${scope === 'group' ? 'groups' : 'members'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              className="max-w-md"
            />
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg">
              {(scope === 'group' ? filteredGroups : filteredMembers).map((item) => {
                const itemId = item.id;
                const itemName = 'group_name' in item ? item.group_name : item.full_name;
                const itemCode = 'group_code' in item ? item.group_code : item.member_code;
                const isSelected = scopeId === itemId;

                return (
                  <button
                    key={itemId}
                    onClick={() => handleScopeIdChange(itemId, itemName)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {itemName}
                    {itemCode && <span className="ml-1 text-xs opacity-70">({itemCode})</span>}
                  </button>
                );
              })}
              {(scope === 'group' ? filteredGroups : filteredMembers).length === 0 && (
                <p className="text-sm text-slate-500 p-2">No {scope === 'group' ? 'groups' : 'members'} found</p>
              )}
            </div>
          </div>
        )}

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="allocated">Allocated</option>
                <option value="unallocated">Unallocated</option>
                <option value="error">Error</option>
                <option value="duplicate">Duplicate</option>
              </select>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  setDateRange({
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                  });
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Last 7 days
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 30);
                  setDateRange({
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                  });
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Last 30 days
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), 1);
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  setDateRange({
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                  });
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                This Month
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-slate-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : (
        renderKpis()
      )}

      {/* Breakdown Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        renderBreakdown()
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-700">Transaction Ledger</h3>
          <Badge variant="default">{ledgerTotal.toLocaleString()} transactions</Badge>
        </div>
        <ReportLedgerTable
          rows={ledger}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={ledger.length < ledgerTotal}
          onLoadMore={loadMoreLedger}
          emptyMessage="No transactions found for the selected filters"
        />
      </div>
    </div>
  );
};

export default Reports;

