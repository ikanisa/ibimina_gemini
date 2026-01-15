import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ViewState } from '@/core/types';
import { isSuperAdmin } from '../lib/utils/roleHelpers';
import { useDashboardKPIs, DashboardData } from '@/hooks/useDashboardKPIs';
import {
  KpiCard,
  AttentionItem,
  PreviewList,
  ActivityList,
  DashboardHealthBanner,
  InstitutionSwitcher
} from './dashboard/index';
import { DashboardSkeleton } from './ui/PageSkeletons';


// API response structure matching the RPC function
// Interface imported from useDashboardKPIs

interface MinimalistDashboardProps {
  onNavigate?: (view: ViewState) => void;
}

const formatCurrency = (amount: number, currency = 'RWF') => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${currency}`;
  }
  return `${amount.toLocaleString()} ${currency}`;
};

const MinimalistDashboard: React.FC<MinimalistDashboardProps> = ({ onNavigate }) => {
  const { role, institutionId: userInstitutionId } = useAuth();

  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);

  const isPlatformAdmin = isSuperAdmin(role);

  // Use the cached hook
  const {
    data,
    isLoading: loading,
    error: apiError,
    refetch,
    isRefetching: refreshing
  } = useDashboardKPIs(selectedInstitutionId);

  // Derive display error from API error
  const error = apiError ? (apiError instanceof Error ? apiError.message : 'Unable to load dashboard data') : null;

  const loadDashboard = useCallback(async (showRefreshIndicator = false) => {
    // Rely on refetch from hook
    if (showRefreshIndicator || !loading) {
      await refetch();
    }
  }, [refetch, loading]);

  // Dashboard data is automatically loaded by the hook when selectedInstitutionId changes


  // Navigation handlers - map action paths to ViewState
  const handleNavigate = (path: string) => {
    if (!onNavigate) return;

    // Handle paths with query params
    const basePath = path.split('?')[0];

    switch (basePath) {
      case '/allocation-queue':
      case '/reconciliation':
        // Navigate to Transactions page (unallocated transactions are shown there)
        onNavigate(ViewState.TRANSACTIONS);
        break;
      case '/momo-operations':
        // Navigate to Transactions page (parse errors can be viewed there)
        onNavigate(ViewState.TRANSACTIONS);
        break;
      case '/settings/sms-sources':
      case '/settings/institution':
        onNavigate(ViewState.SETTINGS);
        break;
      case '/transactions':
        onNavigate(ViewState.TRANSACTIONS);
        break;
      default:
        // Stay on dashboard
        break;
    }
  };

  const handleViewAllUnallocated = () => {
    // Navigate to Transactions page with unallocated filter
    onNavigate?.(ViewState.TRANSACTIONS);
  };

  const handleViewAllParseErrors = () => {
    // Navigate to Transactions page (parse errors can be viewed there)
    onNavigate?.(ViewState.TRANSACTIONS);
  };

  const handleViewAuditLog = () => {
    // Navigate to Settings page where audit log is available
    onNavigate?.(ViewState.SETTINGS);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
        <p className="text-red-800 font-medium">{error}</p>
        <button
          onClick={() => loadDashboard()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Compute derived health for banner with null safety
  const health = data.health ?? {
    momo_primary_code_present: false,
    sms_sources_offline_count: 0,
    last_sms_seen_at: null,
  };

  const healthForBanner = {
    momo_primary_code_present: health.momo_primary_code_present ?? false,
    sms_sources_last_seen: health.last_sms_seen_at ?? null,
    sms_sources_offline_count: health.sms_sources_offline_count ?? 0,
    sms_sources_total_count: (health.sms_sources_offline_count ?? 0) > 0 ? health.sms_sources_offline_count : 1,
    overall_status: (
      !(health.momo_primary_code_present ?? false) || (health.sms_sources_offline_count ?? 0) > 0
        ? 'warning'
        : 'healthy'
    ) as 'healthy' | 'warning' | 'critical'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header with Institution Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {data.is_global ? 'All institutions' : 'Your institution'} • Last {data.kpis.last_days.days} days
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InstitutionSwitcher
            selectedInstitutionId={selectedInstitutionId}
            onSelect={setSelectedInstitutionId}
            isPlatformAdmin={isPlatformAdmin}
          />
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Health Banner */}
      <DashboardHealthBanner health={healthForBanner} onNavigate={handleNavigate} />

      {/* KPI Row - Simplified to 4-5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Today's Collections"
          value={formatCurrency(data.kpis.today.received_total)}
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          trend="up"
        />
        <KpiCard
          title="Today Allocated"
          value={data.kpis.today.allocated_count}
          icon={CheckCircle}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Today Unallocated"
          value={data.kpis.today.unallocated_count}
          icon={AlertCircle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          alert={data.kpis.today.unallocated_count > 0}
        />
        <KpiCard
          title={`${data.kpis.last_days.days}d Collections`}
          value={formatCurrency(data.kpis.last_days.received_total)}
          subtext={`${data.kpis.last_days.allocated_count} allocated`}
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Needs Attention */}
      {data.attention.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Needs Attention
          </h2>
          <div className="space-y-2">
            {data.attention.map((item, index) => (
              <AttentionItem
                key={index}
                type={item.type}
                title={item.title}
                count={item.count}
                severity={item.severity}
                actionPath={item.action_path}
                onAction={handleNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PreviewList
          title="Unallocated Transactions"
          type="unallocated"
          items={data.unallocated_preview.map(item => ({
            ...item,
            currency: 'RWF',
            payer_name: null
          }))}
          onViewAll={handleViewAllUnallocated}
        />
        <PreviewList
          title="Parse Errors"
          type="parse_error"
          items={data.parse_error_preview.map(item => ({
            ...item,
            sms_text: item.parse_error || 'Parse error'
          }))}
          onViewAll={handleViewAllParseErrors}
        />
        <ActivityList
          title="Recent Activity"
          items={data.recent_activity.map(item => ({
            ...item,
            entity_type: item.action.split('_')[0] || 'system'
          }))}
          onViewAll={handleViewAuditLog}
        />
      </div>
    </motion.div>
  );
};

export default MinimalistDashboard;
