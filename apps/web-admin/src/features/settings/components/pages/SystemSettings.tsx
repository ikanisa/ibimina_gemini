import React, { useState, useEffect } from 'react';
import { Server, Database, Cpu, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SettingsCard } from '../SettingsCard';
import { SettingsRow } from '../SettingsRow';
import { HealthBanner } from '../HealthBanner';

interface SystemStats {
  totalInstitutions: number;
  totalUsers: number;
  totalTransactions: number;
  pendingTransactions: number;
  dbConnectionStatus: 'connected' | 'error' | 'unknown';
}

export const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SystemStats>({
    totalInstitutions: 0,
    totalUsers: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    dbConnectionStatus: 'unknown'
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    
    try {
      // Test database connection
      const { error: connectionError } = await supabase.from('institutions').select('id').limit(1);
      
      // Get institution count
      const { count: instCount } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true });
      
      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      // Get transaction count
      const { count: txCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      // Get pending (unallocated) transaction count
      const { count: pendingCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('allocation_status', 'unallocated');
      
      setStats({
        totalInstitutions: instCount || 0,
        totalUsers: userCount || 0,
        totalTransactions: txCount || 0,
        pendingTransactions: pendingCount || 0,
        dbConnectionStatus: connectionError ? 'error' : 'connected'
      });
    } catch (err) {
      console.error('Error loading system stats:', err);
      setStats(prev => ({ ...prev, dbConnectionStatus: 'error' }));
    }
    
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const healthIssues = [];
  if (stats.dbConnectionStatus === 'error') {
    healthIssues.push({
      type: 'alert' as const,
      message: 'Database connection issue detected',
      action: 'Check Supabase project status and network connectivity'
    });
  }
  if (stats.pendingTransactions > 50) {
    healthIssues.push({
      type: 'warning' as const,
      message: `${stats.pendingTransactions} transactions pending allocation`,
      action: 'Consider allocating transactions or adjusting parsing thresholds'
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System</h1>
          <p className="text-sm text-slate-500 mt-1">Platform-wide settings and statistics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <HealthBanner issues={healthIssues} />

      {/* System Status */}
      <SettingsCard
        title="System Status"
        description="Current health and connectivity"
        icon={Server}
      >
        <div className="space-y-0">
          <SettingsRow
            label="Database Connection"
            value={
              <div className="flex items-center gap-2">
                {stats.dbConnectionStatus === 'connected' ? (
                  <>
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span className="text-green-700">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="text-red-600" />
                    <span className="text-red-700">Error</span>
                  </>
                )}
              </div>
            }
          />
          <SettingsRow
            label="Supabase Project"
            value={
              <span className="text-xs font-mono text-slate-600">
                {import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0] || 'Not configured'}
              </span>
            }
            isLast
          />
        </div>
      </SettingsCard>

      {/* Platform Statistics */}
      <SettingsCard
        title="Platform Statistics"
        description="Aggregate metrics across all institutions"
        icon={Database}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.totalInstitutions}</p>
            <p className="text-xs text-slate-500 mt-1">Institutions</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="text-xs text-slate-500 mt-1">Active Users</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.totalTransactions}</p>
            <p className="text-xs text-slate-500 mt-1">Total Transactions</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.pendingTransactions}</p>
            <p className="text-xs text-amber-600 mt-1">Pending Allocation</p>
          </div>
        </div>
      </SettingsCard>

      {/* Edge Functions */}
      <SettingsCard
        title="Edge Functions"
        description="Deployed serverless functions"
        icon={Cpu}
      >
        <div className="space-y-2">
          {[
            { name: 'parse-momo-sms', desc: 'Parses MoMo SMS messages' },
            { name: 'ingest-sms', desc: 'Receives SMS from gateways' },
            { name: 'bulk-import-groups', desc: 'Imports groups from CSV' },
            { name: 'bulk-import-members', desc: 'Imports members from CSV' },
            { name: 'staff-invite', desc: 'Sends staff invitations' }
          ].map(fn => (
            <div key={fn.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-mono font-medium text-slate-700">{fn.name}</p>
                <p className="text-xs text-slate-500">{fn.desc}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Deployed
              </span>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Danger Zone */}
      <SettingsCard
        title="Danger Zone"
        description="Destructive operations - use with caution"
        className="border-red-200"
      >
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-800 font-medium mb-2">Database Maintenance</p>
          <p className="text-xs text-red-700 mb-4">
            Contact system administrators for database maintenance operations like clearing test data, 
            resetting demo accounts, or performing migrations.
          </p>
          <button 
            disabled
            className="text-xs text-red-600 font-medium opacity-50 cursor-not-allowed"
          >
            Contact Support for maintenance operations
          </button>
        </div>
      </SettingsCard>
    </div>
  );
};

export default SystemSettings;


