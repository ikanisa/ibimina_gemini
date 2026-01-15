/**
 * Dashboard Component - Revamped
 * 
 * World-class "Soft Liquid Glass" dashboard with KPI widgets,
 * time range filtering, and unallocated collections actions.
 */

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Wallet,
  Activity,
  Briefcase,
  UserPlus,
  Smartphone,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  BadgeDollarSign,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

import { ViewState } from '@/core/types';
import { useTransactions } from '@/hooks/useTransactions';
import { useDashboardStatsV2 } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';

import { GlassCard } from '@/components/ui/GlassCard';
import { StatWidget } from './StatWidget';
import { TimeRangeFilter, TimeRange } from './TimeRangeFilter';
import { UnallocatedActionsCard } from './UnallocatedActionsCard';
import { useDashboardFilters } from '../hooks/useDashboardFilters';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
}

// Quick Action Button
const QuickAction = memo<{
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void
}>(({ icon, label, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl
               bg-white/70 backdrop-blur-sm border border-slate-200/50 
               shadow-sm hover:shadow-md hover:bg-white/90 
               transition-all duration-200 group"
  >
    <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">
      {label}
    </span>
  </motion.button>
));
QuickAction.displayName = 'QuickAction';

// Activity Feed Item
const ActivityFeedItem = memo<{ transaction: any }>(({ transaction }) => {
  const isDeposit = transaction.type === 'DEPOSIT' || transaction.type === 'CONTRIBUTION';
  const displayType = transaction.type?.replace('_', ' ') || 'Transaction';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 
                 hover:bg-slate-50/50 transition-colors px-2 rounded-lg"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
        ${isDeposit ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
        {isDeposit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-medium text-slate-900 truncate">
            {transaction.members?.full_name || transaction.payer_name || 'Unknown User'}
          </p>
          <span className="text-xs text-slate-400 shrink-0">
            {new Date(transaction.occurred_at || transaction.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 capitalize">
          {displayType.toLowerCase()} via <span className="font-medium">{transaction.channel}</span>
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isDeposit ? 'text-green-600' : 'text-slate-900'}`}>
          {transaction.amount?.toLocaleString()} {transaction.currency || 'RWF'}
        </p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
          ${transaction.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
          {transaction.status}
        </span>
      </div>
    </motion.div>
  );
});
ActivityFeedItem.displayName = 'ActivityFeedItem';

// Main Dashboard Component
const Dashboard: React.FC<DashboardProps> = memo(({ onNavigate }) => {
  const { user, profile } = useAuth();
  const { timeRange, setTimeRange } = useDashboardFilters();

  // Fetch data with time filtering
  const { stats, loading: statsLoading } = useDashboardStatsV2({ timeRange });
  const { transactions: realtimeTransactions, loading: txLoading } = useTransactions({
    limit: 8,
    autoFetch: true
  });

  // Get display name from profile or email
  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';
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

      return { name: dayName, Deposits: deposits, Withdrawals: withdrawals };
    });
  }, [realtimeTransactions]);

  const isLoading = txLoading || statsLoading;

  // Loading skeleton
  if (isLoading && !stats.totalMembers) {
    return (
      <div className="grid place-items-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Format currency values
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M RWF`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K RWF`;
    return `${value.toLocaleString()} RWF`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{displayName ? `, ${displayName}` : ''}!
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here's what's happening with your SACCO today.
          </p>
        </div>

        {/* Time Range Filter */}
        <TimeRangeFilter
          value={timeRange}
          onChange={setTimeRange}
          compact={false}
        />
      </div>

      {/* KPI Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatWidget
          title="Total Deposits"
          value={formatCurrency(stats.totalDeposits)}
          subtext={`${stats.dailyDeposits.toLocaleString()} RWF today`}
          icon={<PiggyBank size={20} />}
          iconBg="bg-gradient-to-br from-green-100 to-emerald-50 text-green-600"
          trend="up"
          trendValue="+4.2%"
          variant="green"
          delay={0}
          testId="stat-deposits"
        />

        <StatWidget
          title="Total Members"
          value={stats.totalMembers.toLocaleString()}
          subtext={`${stats.activeMembers} active`}
          icon={<Users size={20} />}
          iconBg="bg-gradient-to-br from-blue-100 to-indigo-50 text-blue-600"
          trend="up"
          trendValue="+2.1%"
          variant="blue"
          delay={0.05}
          onClick={() => onNavigate(ViewState.MEMBERS)}
          testId="stat-members"
        />

        <StatWidget
          title="Total Groups"
          value={stats.activeGroups.toString()}
          subtext={formatCurrency(stats.totalGroupFunds)}
          icon={<Briefcase size={20} />}
          iconBg="bg-gradient-to-br from-purple-100 to-violet-50 text-purple-600"
          trend="neutral"
          variant="purple"
          delay={0.1}
          onClick={() => onNavigate(ViewState.GROUPS)}
          testId="stat-groups"
        />

        <StatWidget
          title="Outstanding Loans"
          value={formatCurrency(stats.outstandingLoans)}
          subtext={`${stats.totalLoans || 0} active loans`}
          icon={<BadgeDollarSign size={20} />}
          iconBg="bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600"
          trend="down"
          trendValue="-1.8%"
          variant="default"
          delay={0.15}
          onClick={() => onNavigate(ViewState.LOANS)}
          testId="stat-loans"
        />

        <UnallocatedActionsCard
          count={stats.unallocatedCount}
          onNavigate={onNavigate}
          delay={0.2}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            icon={<Briefcase size={20} />}
            label="New Group"
            color="bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600"
            onClick={() => onNavigate(ViewState.GROUPS)}
          />
          <QuickAction
            icon={<UserPlus size={20} />}
            label="Add Member"
            color="bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600"
            onClick={() => onNavigate(ViewState.MEMBERS)}
          />
          <QuickAction
            icon={<Smartphone size={20} />}
            label="Record Deposit"
            color="bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600"
            onClick={() => onNavigate(ViewState.TRANSACTIONS)}
          />
          <QuickAction
            icon={<CreditCard size={20} />}
            label="View Reports"
            color="bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600"
            onClick={() => onNavigate(ViewState.REPORTS)}
          />
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <GlassCard className="p-5 flex flex-col h-[400px]" delay={0.25}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              Live Activity
            </h2>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 -mr-1">
            {realtimeTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Activity size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              realtimeTransactions.map((tx) => (
                <ActivityFeedItem key={tx.id} transaction={tx} />
              ))
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onNavigate(ViewState.TRANSACTIONS)}
              className="w-full py-2.5 text-sm text-blue-600 font-medium 
                         hover:bg-blue-50 rounded-xl transition-colors"
            >
              View All Transactions
            </motion.button>
          </div>
        </GlassCard>

        {/* Chart Section */}
        <GlassCard className="lg:col-span-2 p-5" delay={0.3}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Weekly Flow
            </h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
              Last 7 days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => value >= 1000 ? `${value / 1000}K` : value}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)'
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  formatter={(value: number) => [value.toLocaleString() + ' RWF', undefined]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '16px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="Deposits"
                  fill="#22c55e"
                  radius={[6, 6, 0, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="Withdrawals"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
