
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, FileText, ArrowRight, Scale, Wallet, Smartphone, DollarSign, Filter, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { SupabaseReconciliationIssue } from '../types';

type RecTab = 'MoMo vs Ledger' | 'Branch Cash' | 'Token Reserve';

const Reconciliation: React.FC = () => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  const [activeTab, setActiveTab] = useState<RecTab>('MoMo vs Ledger');
  const [issues, setIssues] = useState<SupabaseReconciliationIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastClosedLabel, setLastClosedLabel] = useState<string>('—');
  const [expectedCash, setExpectedCash] = useState(0);
  const [cashMovements, setCashMovements] = useState<{ time: string; description: string; amount: number; isDeposit: boolean }[]>([]);

  useEffect(() => {
    if (useMockData) {
      setIssues([]);
      return;
    }
    if (!institutionId) {
      setIssues([]);
      return;
    }

    const loadIssues = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reconciliation_issues')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('status', 'OPEN')
        .order('detected_at', { ascending: false });

      if (error) {
        console.error('Error loading reconciliation issues:', error);
        setError('Unable to load reconciliation issues. Check your connection and permissions.');
        setIssues([]);
        setLoading(false);
        return;
      }

      const { data: resolvedData } = await supabase
        .from('reconciliation_issues')
        .select('resolved_at')
        .eq('institution_id', institutionId)
        .eq('status', 'RESOLVED')
        .order('resolved_at', { ascending: false })
        .limit(1);

      const resolvedAt = resolvedData?.[0]?.resolved_at;
      if (resolvedAt) {
        setLastClosedLabel(new Date(resolvedAt).toLocaleDateString());
      }

      setIssues((data as SupabaseReconciliationIssue[]) || []);

      // Load today's cash transactions for Branch Cash tab
      const today = new Date().toISOString().split('T')[0];
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('channel', 'Cash')
        .gte('created_at', today)
        .order('created_at', { ascending: true });

      if (txData && txData.length > 0) {
        const movements = txData.map((tx: any) => {
          const date = new Date(tx.created_at);
          const isDeposit = tx.type === 'Deposit' || tx.type === 'Group Contribution';
          return {
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            description: tx.type + (tx.member_id ? ' (Member)' : ''),
            amount: Number(tx.amount),
            isDeposit
          };
        });
        setCashMovements(movements);
        const total = movements.reduce((sum, m) => sum + (m.isDeposit ? m.amount : -m.amount), 0);
        setExpectedCash(total);
      } else {
        setCashMovements([]);
        setExpectedCash(0);
      }

      setLoading(false);
    };

    loadIssues();
  }, [useMockData, institutionId]);

  const resolveItem = async (id: string, status: 'RESOLVED' | 'IGNORED') => {
    if (useMockData) {
      setIssues((prev) => prev.filter((issue) => issue.id !== id));
      return;
    }

    const { error } = await supabase
      .from('reconciliation_issues')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error resolving reconciliation issue:', error);
      return;
    }

    setIssues((prev) => prev.filter((issue) => issue.id !== id));
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Digital Balance</p>
            <p className="text-2xl font-bold text-green-600">99.8%</p>
            <p className="text-xs text-slate-400 mt-1">Ledger vs MoMo Balance</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-full">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase">Pending Issues</p>
            <p className="text-2xl font-bold text-amber-600">{issues.length}</p>
            <p className="text-xs text-slate-400 mt-1">Require manual review</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase">Last Closed</p>
            <p className="text-2xl font-bold text-slate-900">{lastClosedLabel}</p>
            <p className="text-xs text-slate-400 mt-1">Branch closure snapshot</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-full">
            <Scale size={24} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          {[
            { id: 'MoMo vs Ledger', icon: Smartphone },
            { id: 'Branch Cash', icon: DollarSign },
            { id: 'Token Reserve', icon: Wallet },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RecTab)}
              className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === tab.id
                  ? 'bg-white border-t-2 border-t-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
              <tab.icon size={16} />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2">
              <Filter size={14} /> Filter: All Issues
            </button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              Date: Today
            </button>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
            Export Report
          </button>
        </div>

        {/* Tab Views */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'MoMo vs Ledger' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Detected</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Source (SMS/MoMo)</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ledger Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(issue.detected_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{issue.amount.toLocaleString()} RWF</div>
                      <div className="text-xs text-slate-500">Ref: {issue.source_reference || '—'}</div>
                      <div className="text-xs text-blue-600 mt-0.5">Source: {issue.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                        <AlertTriangle size={12} /> {issue.ledger_status}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">Review required for reconciliation.</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => resolveItem(issue.id, 'RESOLVED')}
                        className="text-blue-600 text-sm font-medium hover:underline mr-3"
                      >
                        Create Entry
                      </button>
                      <button
                        onClick={() => resolveItem(issue.id, 'IGNORED')}
                        className="text-slate-400 text-sm font-medium hover:text-slate-600"
                      >
                        Ignore
                      </button>
                    </td>
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400">
                      <CheckCircle2 size={48} className="mx-auto mb-4 text-green-200" />
                      <p>All MoMo transactions match the system ledger.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'Branch Cash' && (
            <div className="p-6 max-w-4xl mx-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Vault Closure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">System Expected Cash</label>
                    <div className="text-2xl font-bold text-slate-900 bg-white border border-slate-200 rounded-lg p-3">
                      {expectedCash.toLocaleString()} RWF
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Based on recorded Cash In/Out</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Actual Count (Input)</label>
                    <input type="number" className="w-full text-2xl font-bold text-slate-900 bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 rounded-lg p-3 outline-none" placeholder="0" />
                    <p className="text-xs text-slate-400 mt-1">Enter physical vault count</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <h4 className="font-bold text-slate-700 text-sm">Cash Movement Logs (Today)</h4>
                </div>
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {cashMovements.length > 0 ? cashMovements.map((movement, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-4 text-sm text-slate-600">{movement.time}</td>
                        <td className="p-4 text-sm text-slate-900 font-medium">{movement.description}</td>
                        <td className={`p-4 text-right text-sm font-bold ${movement.isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.isDeposit ? '+' : '-'}{movement.amount.toLocaleString()} RWF
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-400 text-sm">
                          No cash transactions recorded today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Token Reserve' && (
            <div className="p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                  <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Total Tokens Issued</p>
                  <p className="text-3xl font-bold text-indigo-900">12,450 TKN</p>
                  <p className="text-xs text-indigo-400 mt-1">Pegged at $1 USD</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">USD Reserve Account</p>
                  <p className="text-3xl font-bold text-green-900">$12,450.00</p>
                  <p className="text-xs text-green-600 mt-1">Held in Bank</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Reserve is Balanced</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                  The total circulating token supply exactly matches the USD funds held in the designated reserve account. No action needed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;
