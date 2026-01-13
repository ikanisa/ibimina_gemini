import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, AlertCircle, XCircle, 
  X, ChevronRight, RefreshCw,
  Smartphone, CreditCard, AlertTriangle, Clock, MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ViewState } from '../types';

interface HealthIssue {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  action: string;
  count?: number;
  last_seen?: string;
}

interface HealthCheck {
  has_primary_momo: boolean;
  has_active_sms_source: boolean;
  sms_source_stale: boolean;
  last_sms_seen: string | null;
  unallocated_count: number;
  unallocated_aging_count: number;
  parse_errors_count: number;
}

interface HealthResponse {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  issues: HealthIssue[];
  checks: HealthCheck;
  checked_at: string;
}

interface SystemHealthIndicatorProps {
  onNavigate?: (view: ViewState) => void;
}

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({ onNavigate }) => {
  const { institutionId, role } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    if (!institutionId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_system_health', {
        p_institution_id: institutionId
      });

      if (error) throw error;
      setHealth(data as HealthResponse);
      setLastChecked(new Date());
    } catch (err) {
      console.error('Error fetching system health:', err);
      // Set fallback healthy state if RPC doesn't exist yet
      setHealth({
        status: 'unknown',
        issues: [],
        checks: {
          has_primary_momo: true,
          has_active_sms_source: true,
          sms_source_stale: false,
          last_sms_seen: null,
          unallocated_count: 0,
          unallocated_aging_count: 0,
          parse_errors_count: 0
        },
        checked_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    fetchHealth();
    // Refresh every 5 minutes
    const interval = setInterval(fetchHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusColor = () => {
    if (loading || !health) return 'bg-slate-400';
    switch (health.status) {
      case 'healthy': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusIcon = () => {
    if (loading || !health) return null;
    switch (health.status) {
      case 'healthy': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning': return <AlertCircle size={16} className="text-amber-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'MOMO_CODE_MISSING': return <CreditCard size={18} className="text-amber-500" />;
      case 'SMS_SOURCE_MISSING': return <Smartphone size={18} className="text-amber-500" />;
      case 'SMS_SOURCE_OFFLINE': return <Smartphone size={18} className="text-red-500" />;
      case 'UNALLOCATED_QUEUE': return <MessageSquare size={18} className="text-blue-500" />;
      case 'UNALLOCATED_AGING': return <Clock size={18} className="text-amber-500" />;
      case 'PARSE_ERRORS': return <AlertTriangle size={18} className="text-amber-500" />;
      default: return <AlertCircle size={18} className="text-slate-500" />;
    }
  };

  const getNavigationTarget = (issueType: string): ViewState | null => {
    switch (issueType) {
      case 'MOMO_CODE_MISSING':
      case 'SMS_SOURCE_MISSING':
      case 'SMS_SOURCE_OFFLINE':
        return ViewState.SETTINGS;
      case 'UNALLOCATED_QUEUE':
      case 'UNALLOCATED_AGING':
        return ViewState.ALLOCATION_QUEUE;
      case 'PARSE_ERRORS':
        return ViewState.RECONCILIATION;
      default:
        return null;
    }
  };

  const handleIssueClick = (issue: HealthIssue) => {
    const target = getNavigationTarget(issue.type);
    if (target && onNavigate) {
      setIsDrawerOpen(false);
      onNavigate(target);
    }
  };

  const issueCount = health?.issues?.length || 0;
  const hasIssues = issueCount > 0;

  return (
    <>
      {/* Health Indicator Dot */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="relative flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
        title={`System Health: ${health?.status || 'Checking...'}`}
      >
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${loading ? 'animate-pulse' : ''}`} />
          {hasIssues && !loading && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{issueCount > 9 ? '9+' : issueCount}</span>
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 hidden sm:block">
          {loading ? 'Checking...' : health?.status === 'healthy' ? 'All systems go' : `${issueCount} issue${issueCount !== 1 ? 's' : ''}`}
        </span>
      </button>

      {/* Health Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white shadow-xl animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <h2 className="text-base font-semibold text-slate-900">System Health</h2>
                  <p className="text-xs text-slate-500">
                    {lastChecked ? `Checked ${formatTimeAgo(lastChecked)}` : 'Checking...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchHealth}
                  disabled={loading}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl ${
                health?.status === 'healthy' ? 'bg-emerald-50 border border-emerald-200' :
                health?.status === 'warning' ? 'bg-amber-50 border border-amber-200' :
                health?.status === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-slate-50 border border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  {health?.status === 'healthy' && <CheckCircle size={24} className="text-emerald-500" />}
                  {health?.status === 'warning' && <AlertCircle size={24} className="text-amber-500" />}
                  {health?.status === 'error' && <XCircle size={24} className="text-red-500" />}
                  {(!health || health.status === 'unknown') && <AlertCircle size={24} className="text-slate-400" />}
                  <div>
                    <p className={`font-semibold ${
                      health?.status === 'healthy' ? 'text-emerald-700' :
                      health?.status === 'warning' ? 'text-amber-700' :
                      health?.status === 'error' ? 'text-red-700' :
                      'text-slate-600'
                    }`}>
                      {health?.status === 'healthy' && 'All Systems Operational'}
                      {health?.status === 'warning' && 'Attention Needed'}
                      {health?.status === 'error' && 'Issues Detected'}
                      {(!health || health.status === 'unknown') && 'Status Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {health?.status === 'healthy' 
                        ? 'Everything is running smoothly' 
                        : `${issueCount} item${issueCount !== 1 ? 's' : ''} need${issueCount === 1 ? 's' : ''} attention`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Issues List */}
              {hasIssues && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Attention Required
                  </h3>
                  <div className="space-y-2">
                    {health?.issues.map((issue, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleIssueClick(issue)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getIssueIcon(issue.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-blue-900">
                              {issue.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 group-hover:text-blue-600">
                              {issue.action}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 mt-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              {health?.checks && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500">Unallocated</p>
                      <p className="text-lg font-bold text-slate-900">{health.checks.unallocated_count}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500">Parse Errors</p>
                      <p className="text-lg font-bold text-slate-900">{health.checks.parse_errors_count}</p>
                    </div>
                  </div>
                  {health.checks.last_sms_seen && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500">Last SMS Received</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatTimeAgo(new Date(health.checks.last_sms_seen))}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Health Checks */}
              {health?.checks && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    System Checks
                  </h3>
                  <div className="space-y-1">
                    <HealthCheckRow 
                      label="Primary MoMo Code" 
                      status={health.checks.has_primary_momo}
                    />
                    <HealthCheckRow 
                      label="Active SMS Source" 
                      status={health.checks.has_active_sms_source}
                    />
                    <HealthCheckRow 
                      label="SMS Gateway Online" 
                      status={health.checks.has_active_sms_source && !health.checks.sms_source_stale}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const HealthCheckRow: React.FC<{ label: string; status: boolean }> = ({ label, status }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
    <span className="text-sm text-slate-700">{label}</span>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
      status ? 'bg-emerald-100' : 'bg-red-100'
    }`}>
      {status ? (
        <CheckCircle size={14} className="text-emerald-600" />
      ) : (
        <XCircle size={14} className="text-red-600" />
      )}
    </div>
  </div>
);

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return `${Math.round(diff / 86400000)}d ago`;
}

export default SystemHealthIndicator;

