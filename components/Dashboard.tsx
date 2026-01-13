
import React, { memo, useMemo, useCallback } from 'react';
import {
  Users,
  Wallet,
  DollarSign,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  UserPlus,
  FilePlus,
  Smartphone,
  CreditCard,
  Upload,
  Briefcase
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { KpiStats, Transaction, ViewState } from '../types';

interface DashboardProps {
  stats: KpiStats;
  recentTransactions: Transaction[];
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

const ActivityFeedItem = memo<{ transaction: Transaction }>(({ transaction }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-2 rounded-lg">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${transaction.type === 'Deposit' || transaction.type === 'Group Contribution' ? 'bg-green-100 text-green-600' :
      transaction.type === 'Loan Repayment' ? 'bg-blue-100 text-blue-600' :
        'bg-slate-100 text-slate-600'
      }`}>
      {transaction.type === 'Deposit' || transaction.type === 'Group Contribution' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-slate-900">{transaction.memberName}</p>
        <span className="text-xs text-slate-400">{transaction.date.split(' ')[1]}</span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5">
        {transaction.type} via <span className="font-medium text-slate-600">{transaction.channel}</span>
      </p>
    </div>
    <div className="text-right">
      <p className={`text-sm font-semibold ${transaction.type.includes('Deposit') || transaction.type.includes('Contribution') ? 'text-green-600' : 'text-slate-900'}`}>
        {transaction.currency === 'USD' ? '$' : ''}{transaction.amount.toLocaleString()} {transaction.currency !== 'USD' ? transaction.currency : ''}
      </p>
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${transaction.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
        }`}>
        {transaction.status}
      </span>
    </div>
  </div>
));

const Dashboard: React.FC<DashboardProps> = memo(({ stats, recentTransactions, onNavigate }) => {
  // Memoize chart data to prevent recreation on every render
  const chartData = useMemo(() => [
    { name: 'Mon', deposits: 4000, withdrawals: 2400 },
    { name: 'Tue', deposits: 3000, withdrawals: 1398 },
    { name: 'Wed', deposits: 2000, withdrawals: 800 },
    { name: 'Thu', deposits: 2780, withdrawals: 1908 },
    { name: 'Fri', deposits: 1890, withdrawals: 800 },
    { name: 'Sat', deposits: 2390, withdrawals: 1800 },
    { name: 'Sun', deposits: 3490, withdrawals: 1300 },
  ], []);

  return (
    <div className="space-y-6">
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
          subtext="3 Issues Pending"
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
            {recentTransactions.map((tx) => (
              <ActivityFeedItem key={tx.id} transaction={tx} />
            ))}
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
              <option>Last Week</option>
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
              <p className="text-xs text-amber-700">MoMo SMS messages found that are not linked to any group contribution.</p>
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
    </div>
  );
});

export default Dashboard;
