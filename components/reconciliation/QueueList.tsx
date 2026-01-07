import React from 'react';
import { Clock, DollarSign, Phone, AlertTriangle, Copy, User } from 'lucide-react';
import type { ReconciliationTab } from './ReconciliationTabs';

interface Transaction {
  id: string;
  occurred_at: string;
  amount: number;
  payer_phone?: string;
  payer_name?: string;
  momo_ref?: string;
  allocation_status: string;
}

interface ParseError {
  id: string;
  received_at: string;
  sender_phone: string;
  sms_text: string;
  parse_error?: string;
}

interface DuplicateGroup {
  match_key: string;
  match_type: string;
  transaction_ids: string[];
  dupe_count: number;
  institution_id: string;
}

interface QueueListProps {
  type: ReconciliationTab;
  items: (Transaction | ParseError | DuplicateGroup)[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

const QueueList: React.FC<QueueListProps> = ({
  type,
  items,
  selectedId,
  onSelect,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="mb-4">
          {type === 'unallocated' && <DollarSign size={48} className="mx-auto opacity-50" />}
          {type === 'parse-errors' && <AlertTriangle size={48} className="mx-auto opacity-50" />}
          {type === 'duplicates' && <Copy size={48} className="mx-auto opacity-50" />}
        </div>
        <p>
          {type === 'unallocated' && 'No unallocated transactions'}
          {type === 'parse-errors' && 'No parse errors'}
          {type === 'duplicates' && 'No duplicates detected'}
        </p>
      </div>
    );
  }

  // Render unallocated transactions
  if (type === 'unallocated') {
    const transactions = items as Transaction[];
    return (
      <div className="divide-y divide-slate-100">
        {transactions.map((tx) => {
          const age = Date.now() - new Date(tx.occurred_at).getTime();
          const hoursOld = Math.floor(age / (1000 * 60 * 60));
          const isAging = hoursOld >= 24;

          return (
            <button
              key={tx.id}
              onClick={() => onSelect(tx.id)}
              className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                selectedId === tx.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-slate-900">
                  {tx.amount?.toLocaleString()} RWF
                </span>
                <span className={`text-xs ${isAging ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                  {hoursOld}h ago
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={14} />
                <span>{tx.payer_phone || 'Unknown'}</span>
              </div>
              {tx.payer_name && (
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <User size={14} />
                  <span>{tx.payer_name}</span>
                </div>
              )}
              {tx.momo_ref && (
                <div className="text-xs text-slate-400 mt-1 font-mono truncate">
                  Ref: {tx.momo_ref}
                </div>
              )}
              {isAging && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                  ⚠ Aging &gt; 24h
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Render parse errors
  if (type === 'parse-errors') {
    const errors = items as ParseError[];
    return (
      <div className="divide-y divide-slate-100">
        {errors.map((err) => (
          <button
            key={err.id}
            onClick={() => onSelect(err.id)}
            className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
              selectedId === err.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={16} />
                <span className="font-medium text-sm">Parse Failed</span>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(err.received_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <Phone size={14} />
              <span>{err.sender_phone}</span>
            </div>
            <div className="text-sm text-slate-500 line-clamp-2">
              {err.sms_text}
            </div>
            {err.parse_error && (
              <div className="mt-2 text-xs text-red-600 truncate">
                Error: {err.parse_error}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Render duplicates
  if (type === 'duplicates') {
    const groups = items as DuplicateGroup[];
    return (
      <div className="divide-y divide-slate-100">
        {groups.map((group) => (
          <button
            key={group.match_key}
            onClick={() => onSelect(group.match_key)}
            className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
              selectedId === group.match_key ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-600">
                <Copy size={16} />
                <span className="font-medium text-sm">{group.dupe_count} Duplicates</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                {group.match_type}
              </span>
            </div>
            <div className="text-sm text-slate-600 font-mono truncate">
              {group.match_key}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {group.transaction_ids.length} transactions to review
            </div>
          </button>
        ))}
      </div>
    );
  }

  return null;
};

export default QueueList;

