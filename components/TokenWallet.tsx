import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Repeat, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import { MOCK_MEMBERS } from '../constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { buildInitialsAvatar } from '../lib/avatars';
import type { SupabaseMember, SupabaseTransaction, Member } from '../types';
import { mapKycStatus, mapMemberStatus } from '../lib/mappers';

const TokenWallet: React.FC = () => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  const [members, setMembers] = useState<Member[]>(useMockData ? MOCK_MEMBERS : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [weeklyPurchaseTotal, setWeeklyPurchaseTotal] = useState(0);
  const [weeklyRedeemTotal, setWeeklyRedeemTotal] = useState(0);
  const [lastActivity, setLastActivity] = useState<Record<string, SupabaseTransaction>>({});

  useEffect(() => {
    if (useMockData) {
      setMembers(MOCK_MEMBERS);
      return;
    }
    if (!institutionId) {
      setMembers([]);
      return;
    }

    const loadWallets = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('institution_id', institutionId)
        .order('token_balance', { ascending: false });

      if (error) {
        console.error('Error loading token wallets:', error);
        setError('Unable to load token wallets. Check your connection and permissions.');
        setMembers([]);
        setLoading(false);
        return;
      }

      const mapped = (data as SupabaseMember[]).map((member) => ({
        id: member.id,
        name: member.full_name,
        phone: member.phone,
        branch: member.branch || 'HQ',
        status: mapMemberStatus(member.status),
        kycStatus: mapKycStatus(member.kyc_status ?? null),
        savingsBalance: member.savings_balance ?? 0,
        loanBalance: member.loan_balance ?? 0,
        tokenBalance: member.token_balance ?? 0,
        joinDate: member.join_date ?? member.created_at.split('T')[0],
        avatarUrl: member.avatar_url || buildInitialsAvatar(member.full_name),
        groups: []
      }));

      setMembers(mapped);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('institution_id', institutionId)
        .in('type', ['Token Purchase', 'Token Redeem'])
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error loading token transactions:', txError);
        setWeeklyPurchaseTotal(0);
        setWeeklyRedeemTotal(0);
        setLastActivity({});
        setLoading(false);
        return;
      }

      const recent = (txData as SupabaseTransaction[]).reduce(
        (acc, tx) => {
          if (tx.type === 'Token Purchase') acc.purchase += Number(tx.amount);
          if (tx.type === 'Token Redeem') acc.redeem += Number(tx.amount);
          if (tx.member_id && !acc.lastActivity[tx.member_id]) {
            acc.lastActivity[tx.member_id] = tx;
          }
          return acc;
        },
        { purchase: 0, redeem: 0, lastActivity: {} as Record<string, SupabaseTransaction> }
      );

      setWeeklyPurchaseTotal(recent.purchase);
      setWeeklyRedeemTotal(recent.redeem);
      setLastActivity(recent.lastActivity);
      setLoading(false);
    };

    loadWallets();
  }, [useMockData, institutionId]);

  const totalSupply = useMemo(
    () => members.reduce((sum, member) => sum + member.tokenBalance, 0),
    [members]
  );

  const filteredMembers = members.filter((member) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return member.name.toLowerCase().includes(term) || member.id.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {/* Token Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign size={24} className="text-white" />
            </div>
            <span className="text-indigo-100 text-xs bg-indigo-700 px-2 py-1 rounded">System Total</span>
          </div>
          <p className="text-3xl font-bold">${totalSupply.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-indigo-200 text-sm mt-1">Total Tokens in Circulation</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">+12% this week</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">${weeklyPurchaseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-sm mt-1">Purchased via MoMo (Last 7d)</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">${weeklyRedeemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-sm mt-1">Redeemed / Spent (Last 7d)</p>
        </div>
      </div>

      {/* Member Wallet Search & List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Member Wallets</h3>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Find member wallet..." 
               className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Member</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Balance (USD)</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Last Activity</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const activity = lastActivity[member.id];
              const isPurchase = activity?.type === 'Token Purchase';
              return (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                    <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-bold text-indigo-700">${member.tokenBalance.toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {activity ? (
                    <>
                      <div className="flex items-center gap-2">
                        {isPurchase ? (
                          <ArrowUpRight size={14} className="text-green-500" />
                        ) : (
                          <ArrowDownLeft size={14} className="text-red-500" />
                        )}
                        <span>{isPurchase ? 'Bought' : 'Redeemed'} ${Number(activity.amount).toFixed(2)}</span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(activity.created_at).toLocaleDateString()}</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">No recent activity</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                   <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 hover:bg-indigo-50 rounded">Manage</button>
                </td>
              </tr>
              );
            })}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                  {useMockData ? 'No token wallets found.' : 'No token wallets yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenWallet;
