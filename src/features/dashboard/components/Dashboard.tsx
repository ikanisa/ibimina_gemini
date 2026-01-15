import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Wallet,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  UserPlus,
  Smartphone,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { KpiStats, SupabaseTransaction, ViewState } from '@/core/types';
import { useTransactions } from '@/hooks/useTransactions';
import { useDashboardStats } from '@/hooks/useDashboardStats';

interface DashboardProps {
  stats?: KpiStats; // Optional now, hook handles it
  recentTransactions?: SupabaseTransaction[]; // Optional now
  onNavigate: (view: ViewState) => void;
}

const StatCard = memo<{ title: string; value: string; subtext?: string; icon: React.ReactNode; trend?: 'up' | 'down' | 'neutral'; alert?: boolean }>(({ title, value, subtext, icon, trend, alert }) => (
  <div className={`bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${alert ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${alert ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>{icon}</div>
      {trend === 'up' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">+2.4% <ArrowUpRight size={12} /></span>}
      {trend === 'down' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">-0.8% <ArrowDownLeft size={12} /></span>}
    </div>
    <div>
      <h3 className="text-slate-500 text-xs uppercase font-semibold tracking-wider mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${alert ? 'text-amber-900' : 'text-slate-900'}`}>{value}</p>
      {subtext && <p className="text-slate-400 text-xs mt-1">{subtext}</p>}
    </div>
  </div>
));

const QuickAction = memo<{ icon: React.ReactNode; label: string; color: string; onClick: () => void }>(({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
  >
    <div className={`p-3 rounded-full ${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{label}</span>
  </button>
));

// @ts-ignore - SupabaseTransaction has different props than the old Transaction
const ActivityFeedItem = memo<{ transaction: any }>(({ transaction }) => {
  const isDeposit = transaction.type === 'DEPOSIT' || transaction.type === 'CONTRIBUTION';
  const displayType = transaction.type.replace('_', ' ');

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-2 rounded-lg">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDeposit ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
        {isDeposit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium text-slate-900">
            {transaction.members?.full_name || transaction.payer_name || 'Unknown User'}
          </p>
          <span className="text-xs text-slate-400">{new Date(transaction.occurred_at || transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 capitalize">
          {displayType.toLowerCase()} via <span className="font-medium text-slate-600">{transaction.channel}</span>
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isDeposit ? 'text-green-600' : 'text-slate-900'}`}>
          {transaction.currency === 'USD' ? '$' : ''}{transaction.amount.toLocaleString()} {transaction.currency !== 'USD' ? transaction.currency : ''}
        </p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${transaction.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
          {transaction.status}
        </span>
      </div>
    </div>
  );
});

const Dashboard: React.FC<DashboardProps> = memo(({ onNavigate }) => {
  // Use real data hooks
  const { transactions: realtimeTransactions, loading: txLoading } = useTransactions({ limit: 10, autoFetch: true });
  const { stats, loading: statsLoading } = useDashboardStats();

  // Aggregate chart data from real transactions (Past 7 days)
  const chartData = useMemo(() => {
    if (!realtimeTransactions.length) return [];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    return last7Days.map(date => {
      const dayName = days[date.getDay()];
      const dayStr = date.toISOString().split('T')[0];

      const dayTxs = realtimeTransactions.filter(tx =>
        (tx.occurred_at || tx.created_at).startsWith(dayStr)
      );

      const deposits = dayTxs
        .filter(tx => tx.type === 'DEPOSIT' || tx.type === 'CONTRIBUTION')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const withdrawals = dayTxs
        .filter(tx => tx.type === 'WITHDRAWAL')
        .reduce((sum, tx) => sum + tx.amount, 0);

      return { name: dayName, deposits, withdrawals };
    });
  }, [realtimeTransactions]);

  const isLoading = txLoading || statsLoading;

  if (isLoading && !stats.totalMembers) {
    return (
      <div className="grid place-items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Groups"
          value={stats.activeGroups.toString()}
          subtext={`${(stats.totalGroupFunds / 1000000).toFixed(1)}M RWF Funds`}
          icon={<Briefcase size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Members"
          value={stats.totalMembers.toLocaleString()}
          subtext={`${stats.activeMembers} Active`}
          icon={<Users size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Savings"
          value={`${(stats.totalSavings / 1000000).toFixed(1)}M RWF`}
          subtext="Individual + Group"
          icon={<Wallet size={20} />}
          trend="up"
        />
        <StatCard
          title="Reconciliation"
          value={stats.reconciliationStatus}
          subtext={stats.reconciliationStatus === 'Issues' ? 'Action Required' : 'All Clear'}
          icon={<AlertCircle size={20} />}
          alert={stats.reconciliationStatus !== 'Balanced'}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          <QuickAction
            icon={<Briefcase size={20} />}
            label="New Group"
            color="bg-blue-100 text-blue-600"
            onClick={() => onNavigate(ViewState.GROUPS)}
          />
          <QuickAction
            icon={<UserPlus size={20} />}
            label="Add Member"
            color="bg-indigo-100 text-indigo-600"
            onClick={() => onNavigate(ViewState.MEMBERS)}
          />
          <QuickAction
            icon={<Smartphone size={20} />}
            label="Record Deposit"
            color="bg-purple-100 text-purple-600"
            onClick={() => onNavigate(ViewState.TRANSACTIONS)}
          />
          <QuickAction
            icon={<CreditCard size={20} />}
            label="View Reports"
            color="bg-orange-100 text-orange-600"
            onClick={() => onNavigate(ViewState.REPORTS)}
          />
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              Live Activity
            </h2>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-1">
            {realtimeTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm">No recent interactions</p>
              </div>
            ) : (
              realtimeTransactions.map((tx) => (
                <ActivityFeedItem key={tx.id} transaction={tx} />
              ))
            )}
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate(ViewState.TRANSACTIONS)}
              className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
            >
              View All Transactions
            </button>
          </div>
        </div>

        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Weekly Flow</h2>
            <select className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500">
              <option>This Week</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="deposits" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="withdrawals" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts Row - Only show if there are issues */}
      {stats.reconciliationStatus !== 'Balanced' && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-600" size={24} />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Reconciliation Pending</h4>
              <p className="text-xs text-amber-700">Unallocated transactions or parse errors detected.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate(ViewState.TRANSACTIONS)}
            className="px-4 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition-colors"
          >
            Review Issues
          </button>
        </div>
      )}
    </motion.div>
  );
});

export default Dashboard;
