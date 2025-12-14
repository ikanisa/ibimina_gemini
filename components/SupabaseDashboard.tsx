import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Scale, 
  Activity,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SupabaseContribution } from '../types';

// ============================================================================
// COMPONENT: SUPABASE DASHBOARD
// ============================================================================

interface DashboardStats {
  totalGroups: number;
  activeMembers: number;
  monthlyContributions: number;
  unreconciledPayments: number;
}

interface ContributionWithRelations extends SupabaseContribution {
  members?: { full_name: string };
  groups?: { group_name: string };
}

const SupabaseDashboard: React.FC = () => {
  const { institutionId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalGroups: 0,
    activeMembers: 0,
    monthlyContributions: 0,
    unreconciledPayments: 0
  });
  const [recentActivity, setRecentActivity] = useState<ContributionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [institutionId]);

  const loadDashboard = async () => {
    if (!institutionId) return;

    try {
      // Get counts
      const [groups, members, contributions, payments] = await Promise.all([
        supabase.from('groups').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('status', 'ACTIVE'),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('status', 'ACTIVE'),
        supabase.from('contributions').select('amount').eq('institution_id', institutionId).gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('incoming_payments').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('status', 'UNRECONCILED')
      ]);

      const contributionData = contributions.data as { amount: number }[] | null;
      const monthlyTotal = contributionData?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      setStats({
        totalGroups: groups.count || 0,
        activeMembers: members.count || 0,
        monthlyContributions: monthlyTotal,
        unreconciledPayments: payments.count || 0
      });

      // Recent activity
      const { data: recent } = await supabase
        .from('contributions')
        .select('*, members(full_name), groups(group_name)')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity((recent as ContributionWithRelations[]) || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Briefcase size={24} />
            </div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalGroups}</p>
          <p className="text-slate-500 text-sm mt-1">Total Groups</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Users size={24} />
            </div>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.activeMembers}</p>
          <p className="text-slate-500 text-sm mt-1">Active Members</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <DollarSign size={24} />
            </div>
            <span className="text-xs text-slate-500">This Month</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.monthlyContributions.toLocaleString()}</p>
          <p className="text-slate-500 text-sm mt-1">Contributions (RWF)</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Scale size={24} />
            </div>
            {stats.unreconciledPayments > 0 && <AlertCircle size={16} className="text-amber-500" />}
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.unreconciledPayments}</p>
          <p className="text-slate-500 text-sm mt-1">Unreconciled Payments</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Activity size={20} className="text-blue-600" />
            Recent Contributions
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentActivity.map((contrib) => (
            <div key={contrib.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {contrib.members?.full_name?.charAt(0) || 'M'}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{contrib.members?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">{contrib.groups?.group_name || 'No Group'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">+{contrib.amount.toLocaleString()} RWF</p>
                <p className="text-xs text-slate-400">{new Date(contrib.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="p-8 text-center text-slate-400">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupabaseDashboard;
