/**
 * Reports Component (Refactored)
 * Main container for reports and analytics
 * Uses modular components from components/reports/
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLayout, Section } from './layout';
import { isSuperAdmin } from '../lib/utils/roleHelpers';
import { Button, Badge, ErrorDisplay, LoadingSpinner } from './ui';
import { ReportsSkeleton } from './ui/PageSkeletons';
import { ReportFilters } from './reports/ReportFilters';
import { ReportKPIs } from './reports/ReportKPIs';
import {
  BreakdownTable,
  ReportLedgerTable,
  CsvExport,
  objectsToCsv,
  generateReportFilename,
} from './reports/index';
import type {
  ReportScope,
  StatusFilter,
  ReportSummary,
  LedgerRow,
  GroupOption,
  MemberOption,
} from './reports/types';

const LEDGER_PAGE_SIZE = 50;

const Reports: React.FC = () => {
  const { institutionId, role } = useAuth();
  const isPlatformAdmin = isSuperAdmin(role);

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
      end: end.toISOString().split('T')[0],
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
      const effectiveScopeId =
        scope === 'institution' ? (isPlatformAdmin ? scopeId : institutionId) : scopeId;

      // Load summary
      const { data: summaryData, error: summaryError } = await supabase.rpc(
        'get_report_summary',
        {
          p_scope: scope,
          p_scope_id: effectiveScopeId,
          p_from: `${dateRange.start}T00:00:00Z`,
          p_to: `${dateRange.end}T23:59:59Z`,
          p_status: statusFilter === 'all' ? null : statusFilter,
        }
      );

      if (summaryError) throw summaryError;

      setSummary({
        kpis: summaryData?.kpis || {},
        breakdown: summaryData?.breakdown || [],
      });

      // Load ledger (first page)
      const { data: ledgerData, error: ledgerError } = await supabase.rpc('get_report_ledger', {
        p_scope: scope,
        p_scope_id: effectiveScopeId,
        p_from: `${dateRange.start}T00:00:00Z`,
        p_to: `${dateRange.end}T23:59:59Z`,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_limit: LEDGER_PAGE_SIZE,
        p_offset: 0,
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
      const effectiveScopeId =
        scope === 'institution' ? (isPlatformAdmin ? scopeId : institutionId) : scopeId;

      const { data, error } = await supabase.rpc('get_report_ledger', {
        p_scope: scope,
        p_scope_id: effectiveScopeId,
        p_from: `${dateRange.start}T00:00:00Z`,
        p_to: `${dateRange.end}T23:59:59Z`,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_limit: LEDGER_PAGE_SIZE,
        p_offset: ledger.length,
      });

      if (error) throw error;

      setLedger((prev) => [...prev, ...(data?.rows || [])]);
    } catch (err) {
      console.error('Error loading more ledger:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    ledger.length,
    ledgerTotal,
    scope,
    scopeId,
    institutionId,
    isPlatformAdmin,
    dateRange,
    statusFilter,
  ]);

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

  // Export CSV using enhanced utilities
  const handleExportCsv = useCallback(async (): Promise<string> => {
    const effectiveScopeId =
      scope === 'institution' ? (isPlatformAdmin ? scopeId : institutionId) : scopeId;

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
        p_offset: offset,
      });

      if (error) throw error;
      if (!data?.rows?.length) break;

      allRows.push(...data.rows);
      offset += batchSize;

      if (data.rows.length < batchSize) break;
    }

    // Convert to CSV using enhanced export utilities
    const { arrayToCSV, downloadCSV } = await import('../lib/csv/export');
    const csvContent = arrayToCSV(allRows);
    const filename = `report_${scope}_${scopeName || 'all'}_${dateRange.start}_to_${dateRange.end}.csv`;
    downloadCSV(csvContent, filename);
    return csvContent;

    // Legacy format (kept for compatibility)
    return objectsToCsv(allRows as unknown as Record<string, unknown>[], [
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
      { key: 'group_code', header: 'Group Code' },
    ]);
  }, [scope, scopeId, institutionId, isPlatformAdmin, dateRange, statusFilter, scopeName]);

  // Breakdown table click handler
  const handleBreakdownClick = (id: string) => {
    if (scope === 'institution') {
      // Drill down to group
      const group = groups.find((g) => g.id === id);
      if (group) {
        setScope('group');
        setScopeId(id);
        setScopeName(group.group_name);
      }
    } else if (scope === 'group') {
      // Drill down to member
      const member = members.find((m) => m.id === id);
      if (member) {
        setScope('member');
        setScopeId(id);
        setScopeName(member.full_name);
      }
    }
  };

  // Render breakdown table
  const breakdownRows = useMemo(() => {
    if (!summary?.breakdown || scope === 'member') return [];

    return summary.breakdown.map((row) => ({
      id: row.group_id || row.member_id || '',
      name: row.group_name || row.member_name || 'Unknown',
      code: row.group_code || row.member_code,
      transactionCount: row.transaction_count || 0,
      totalAmount: row.total_received || row.total_contributed || 0,
      unallocatedCount: row.unallocated_count,
    }));
  }, [summary?.breakdown, scope]);

  const breakdownTitle =
    scope === 'institution' ? 'Breakdown by Group' : 'Breakdown by Member';

  // Show skeleton while loading initial data
  if (loading && !summary) {
    return (
      <PageLayout>
        <Section>
          <ReportsSkeleton />
        </Section>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Reports"
      description={scopeName && `${scope === 'group' ? 'Group' : scope === 'member' ? 'Member' : 'Institution'}: ${scopeName}`}
      actions={
        <>
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
        </>
      }
    >
      {/* Filters */}
      <ReportFilters
        scope={scope}
        onScopeChange={handleScopeChange}
        scopeId={scopeId}
        scopeName={scopeName}
        onScopeIdChange={handleScopeIdChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        groups={groups}
        members={members}
        isPlatformAdmin={isPlatformAdmin}
      />

      {/* Error Banner */}
      {error && (
        <ErrorDisplay error={error} variant="banner" onRetry={loadReport} />
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
        summary && <ReportKPIs scope={scope} kpis={summary.kpis} />
      )}

      {/* Breakdown Table */}
      {loading ? (
        <Section title={breakdownTitle}>
          <LoadingSpinner size="lg" text="Loading breakdown..." />
        </Section>
      ) : (
        breakdownRows.length > 0 && (
          <Section title={breakdownTitle}>
            <BreakdownTable
              title={breakdownTitle}
              rows={breakdownRows}
              onRowClick={handleBreakdownClick}
              emptyMessage={`No ${scope === 'institution' ? 'groups' : 'members'} found`}
            />
          </Section>
        )
      )}

      {/* Ledger Table */}
      <Section
        title="Transaction Ledger"
        headerActions={<Badge variant="default">{ledgerTotal.toLocaleString()} transactions</Badge>}
      >
        <ReportLedgerTable
          rows={ledger}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={ledger.length < ledgerTotal}
          onLoadMore={loadMoreLedger}
          emptyMessage="No transactions found for the selected filters"
        />
      </Section>
    </PageLayout>
  );
};

export default Reports;
