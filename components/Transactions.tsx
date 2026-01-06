
import React, { useEffect, useState, useMemo } from 'react';
import { Transaction, ViewState } from '../types';
import { Download, Filter, ExternalLink, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { mapTransactionStatus, mapTransactionType, mapTransactionChannel } from '../lib/mappers';
import { LoadingSpinner, ErrorDisplay, EmptyState, Button, SearchInput, Badge } from './ui';

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
        .from('transactions')
        .select('*, members(full_name)')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading transactions:', error);
        setError('Unable to load transactions. Check your connection and permissions.');
        setTransactions([]);
        setLoading(false);
        return;
      }

      const mapped = (data as any[]).map((tx) => {
        const date = new Date(tx.created_at);
        const dateLabel = `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`;
        return {
          id: tx.id,
          date: dateLabel,
          memberId: tx.member_id ?? '—',
          memberName: tx.members?.full_name ?? tx.counterparty ?? 'Unknown',
          type: mapTransactionType(tx.type || 'Deposit'),
          amount: Number(tx.amount) || 0,
          currency: tx.currency || 'RWF',
          channel: mapTransactionChannel(tx.channel),
          status: mapTransactionStatus(tx.status || 'COMPLETED'),
          reference: tx.reference || '—',
          groupId: tx.group_id ?? undefined
        };
      });

      setTransactions(mapped);
      setLoading(false);
    };

    loadTransactions();
  }, [transactionsProp, useMockData, institutionId]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter((tx) =>
      tx.reference.toLowerCase().includes(term) ||
      tx.memberName.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  // Loading state
  if (loading) {
    return <LoadingSpinner size="lg" text="Loading transactions..." className="h-64" />;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
      {/* Error Display */}
      {error && (
        <ErrorDisplay error={error} variant="banner" />
      )}
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Ledger</h2>
        <div className="flex gap-2">
          <SearchInput
            placeholder="Search Ref or Member"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            className="w-64"
          />
          <Button variant="secondary" size="sm" leftIcon={<Filter size={16} />}>
            Filter
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Download size={16} />}>
            Export
          </Button>
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
              <tr key={tx.id} className="hover:bg-slate-50 active:bg-slate-100 transition-all duration-150 cursor-pointer touch-manipulation">
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
                  <Badge variant="default">{tx.channel}</Badge>
                  <div className="text-xs text-slate-400 mt-0.5">{tx.reference}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold ${tx.type === 'Deposit' || tx.type === 'Loan Repayment' || tx.type === 'Group Contribution' ? 'text-green-600' : 'text-slate-900'
                    }`}>
                    {tx.currency === 'USD' ? '$' : ''}{tx.amount.toLocaleString()} {tx.currency !== 'USD' ? tx.currency : ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Badge
                    variant={tx.status === 'Completed' ? 'success' : tx.status === 'Pending' ? 'warning' : 'danger'}
                  >
                    {tx.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={FileText}
                    title={useMockData ? 'No transactions found' : 'No transactions yet'}
                    description={useMockData
                      ? 'No transactions match your search.'
                      : 'Record activity to populate the ledger.'}
                  />
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
