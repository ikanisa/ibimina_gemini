
import React, { useEffect, useState } from 'react';
import { Transaction, ViewState, SupabaseMember, SupabaseTransaction } from '../types';
import { Download, Filter, Search, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { mapTransactionStatus, mapTransactionType } from '../lib/mappers';

interface TransactionsProps {
  transactions?: Transaction[];
  onNavigate?: (view: ViewState) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions: transactionsProp, onNavigate }) => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(transactionsProp ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (transactionsProp !== undefined) {
      setTransactions(transactionsProp);
      return;
    }
    if (useMockData) {
      return;
    }
    if (!institutionId) {
      setTransactions([]);
      return;
    }

    const loadTransactions = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('payment_ledger')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        setError('Unable to load transactions. Check your connection and permissions.');
        setTransactions([]);
        setLoading(false);
        return;
      }

      const mapped = (data as any[]).map((tx) => {
        const date = new Date(tx.created_at || tx.received_at);
        const dateLabel = `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`;
        return {
          id: tx.id,
          date: dateLabel,
          memberId: tx.member_id ?? '—',
          memberName: tx.counterparty ?? 'Unknown',
          type: mapTransactionType(tx.txn_type || tx.type),
          amount: Number(tx.amount) || 0,
          currency: tx.currency || 'RWF',
          channel: 'MoMo' as Transaction['channel'],
          status: mapTransactionStatus(tx.reconciled ? 'RECONCILED' : tx.status),
          reference: tx.reference || tx.txn_id || '—',
          groupId: tx.group_id ?? undefined
        };
      });

      setTransactions(mapped);
      setLoading(false);
    };

    loadTransactions();
  }, [transactionsProp, useMockData, institutionId]);

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      tx.reference.toLowerCase().includes(term) ||
      tx.memberName.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-120px)]">
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Ledger</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Ref or Member"
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Member</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Type</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Channel</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Amount</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900 font-medium">{tx.date.split(' ')[0]}</div>
                  <div className="text-xs text-slate-400">{tx.date.split(' ')[1]}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onNavigate && onNavigate(ViewState.MEMBERS)}
                    className="text-left group"
                  >
                    <div className="text-sm text-slate-900 group-hover:text-blue-600 font-medium flex items-center gap-1">
                      {tx.memberName}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{tx.memberId}</div>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-700 block">{tx.type}</span>
                  {tx.groupId && (
                    <button
                      onClick={() => onNavigate && onNavigate(ViewState.GROUPS)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Group Linked
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                    {tx.channel}
                  </span>
                  <div className="text-xs text-slate-400 mt-0.5">{tx.reference}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold ${tx.type === 'Deposit' || tx.type === 'Loan Repayment' || tx.type === 'Group Contribution' ? 'text-green-600' : 'text-slate-900'
                    }`}>
                    {tx.currency === 'USD' ? '$' : ''}{tx.amount.toLocaleString()} {tx.currency !== 'USD' ? tx.currency : ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                  {useMockData ? 'No transactions found.' : 'No transactions yet. Record activity to populate the ledger.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
