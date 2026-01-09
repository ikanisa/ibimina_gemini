import React, { useState, useEffect, useCallback } from 'react';
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
import { ViewState } from '../types';
import { withTimeout } from '../lib/utils/timeout';
import {
  KpiCard,
  AttentionItem,
  PreviewList,
  ActivityList,
  DashboardHealthBanner,
  InstitutionSwitcher
} from './dashboard/index';

// API response structure matching the RPC function
interface DashboardData {
  institution_id: string | null;
  is_global: boolean;
  period_days: number;
  generated_at: string;
  kpis: {
    today: {
      received_total: number;
      allocated_count: number;
      unallocated_count: number;
      parse_errors_count: number;
    };
    last_days: {
      days: number;
      received_total: number;
      allocated_count: number;
      unallocated_count: number;
      unallocated_aging_24h: number;
      parse_errors_count: number;
    };
  };
  attention: Array<{
    type: string;
    title: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
    action_path: string;
  }>;
  unallocated_preview: Array<{
    id: string;
    occurred_at: string;
    amount: number;
    payer_phone: string | null;
    momo_ref: string | null;
  }>;
  parse_error_preview: Array<{
    id: string;
    received_at: string;
    sender_phone: string;
    parse_error: string | null;
  }>;
  recent_activity: Array<{
    id: string;
    created_at: string;
    action: string;
    actor_user_id: string;
    actor_email: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  health: {
    momo_primary_code_present: boolean;
    sms_sources_offline_count: number;
    last_sms_seen_at: string | null;
  };
}

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);

  const isPlatformAdmin = role === 'Super Admin' || role === 'PLATFORM_ADMIN';

  const loadDashboard = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const rpcQuery = supabase.rpc('get_dashboard_summary', {
        p_institution_id: isPlatformAdmin ? selectedInstitutionId : null,
        p_days: 7
      });

      const response = await withTimeout(
        Promise.resolve(rpcQuery),
        20000, // 20 second timeout for dashboard
        'Dashboard load timeout'
      );
      const { data: result, error: rpcError } = response;

      if (rpcError) {
        console.error('Dashboard RPC error:', rpcError);
        setError('Unable to load dashboard data. Please try again.');
      } else {
        setData(result as DashboardData);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      if (errorMsg.includes('timeout')) {
        setError('Loading dashboard timed out. Please check your connection and try again.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPlatformAdmin, selectedInstitutionId]);

  // Only load dashboard when institution changes or on mount
  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstitutionId]); // Re-load when institution changes

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
    return (
      <div className="space-y-6 animate-pulse">
        {/* KPI Skeletons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-32">
              <div className="w-10 h-10 bg-slate-100 rounded-lg mb-4" />
              <div className="h-6 bg-slate-100 rounded w-20 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
        {/* Content Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 h-64" />
          <div className="bg-white rounded-xl border border-slate-200 h-64" />
          <div className="bg-white rounded-xl border border-slate-200 h-64" />
        </div>
      </div>
    );
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

  // Compute derived health for banner
  const healthForBanner = {
    momo_primary_code_present: data.health.momo_primary_code_present,
    sms_sources_last_seen: data.health.last_sms_seen_at,
    sms_sources_offline_count: data.health.sms_sources_offline_count,
    sms_sources_total_count: data.health.sms_sources_offline_count > 0 ? data.health.sms_sources_offline_count : 1,
    overall_status: (
      !data.health.momo_primary_code_present || data.health.sms_sources_offline_count > 0
        ? 'warning' 
        : 'healthy'
    ) as 'healthy' | 'warning' | 'critical'
  };

  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default MinimalistDashboard;
