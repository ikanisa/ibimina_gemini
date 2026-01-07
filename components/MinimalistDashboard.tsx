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
import {
  KpiCard,
  AttentionItem,
  PreviewList,
  ActivityList,
  DashboardHealthBanner,
  InstitutionSwitcher
} from './dashboard';

interface DashboardData {
  institution_id: string | null;
  is_global: boolean;
  period_days: number;
  generated_at: string;
  kpis: {
    today: {
      received: number;
      allocated_count: number;
      unallocated_count: number;
    };
    period: {
      days: number;
      received: number;
      allocated_count: number;
      unallocated_count: number;
      parse_errors_count: number;
      unallocated_aging_count: number;
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
    currency: string;
    payer_phone: string | null;
    payer_name: string | null;
    momo_ref: string | null;
  }>;
  parse_error_preview: Array<{
    id: string;
    received_at: string;
    sender_phone: string;
    sms_text: string;
    parse_error: string | null;
  }>;
  recent_activity: Array<{
    id: string;
    created_at: string;
    action: string;
    entity_type: string;
    actor_email: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  health: {
    momo_primary_code_present: boolean;
    sms_sources_last_seen: string | null;
    sms_sources_offline_count: number;
    sms_sources_total_count: number;
    overall_status: 'healthy' | 'warning' | 'critical';
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

  const isPlatformAdmin = role === 'Super Admin';

  const loadDashboard = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_dashboard_summary', {
        p_institution_id: isPlatformAdmin ? selectedInstitutionId : null,
        p_days: 7
      });

      if (rpcError) {
        console.error('Dashboard RPC error:', rpcError);
        setError('Unable to load dashboard data. Please try again.');
      } else {
        setData(result as DashboardData);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPlatformAdmin, selectedInstitutionId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Navigation handlers
  const handleNavigate = (path: string) => {
    if (!onNavigate) return;
    
    switch (path) {
      case '/allocation-queue':
        onNavigate(ViewState.ALLOCATION_QUEUE);
        break;
      case '/momo-operations':
        onNavigate(ViewState.MOMO_OPERATIONS);
        break;
      case '/settings/sms-sources':
      case '/settings/institution':
        onNavigate(ViewState.SETTINGS);
        break;
      case '/transactions':
        onNavigate(ViewState.TRANSACTIONS);
        break;
      case '/reconciliation':
        onNavigate(ViewState.RECONCILIATION);
        break;
      default:
        // Stay on dashboard
        break;
    }
  };

  const handleViewAllUnallocated = () => {
    onNavigate?.(ViewState.ALLOCATION_QUEUE);
  };

  const handleViewAllParseErrors = () => {
    onNavigate?.(ViewState.MOMO_OPERATIONS);
  };

  const handleViewAuditLog = () => {
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

  return (
    <div className="space-y-6">
      {/* Header with Institution Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {data.is_global ? 'All institutions' : 'Your institution'} • Last {data.kpis.period.days} days
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
      <DashboardHealthBanner health={data.health} onNavigate={handleNavigate} />

      {/* KPI Row - Max 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Today's Collections"
          value={formatCurrency(data.kpis.today.received)}
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
          title={`${data.kpis.period.days}d Collections`}
          value={formatCurrency(data.kpis.period.received)}
          subtext={`${data.kpis.period.allocated_count} allocated`}
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <KpiCard
          title="Parse Errors"
          value={data.kpis.period.parse_errors_count}
          subtext="Last 7 days"
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          alert={data.kpis.period.parse_errors_count > 0}
        />
        <KpiCard
          title="Aging > 24h"
          value={data.kpis.period.unallocated_aging_count}
          subtext="Unallocated"
          icon={Clock}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          alert={data.kpis.period.unallocated_aging_count > 0}
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
          items={data.unallocated_preview}
          onViewAll={handleViewAllUnallocated}
        />
        <PreviewList
          title="Parse Errors"
          type="parse_error"
          items={data.parse_error_preview}
          onViewAll={handleViewAllParseErrors}
        />
        <ActivityList
          title="Recent Activity"
          items={data.recent_activity}
          onViewAll={handleViewAuditLog}
        />
      </div>
    </div>
  );
};

export default MinimalistDashboard;

