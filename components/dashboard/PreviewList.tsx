import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';

interface UnallocatedTransaction {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  payer_phone: string | null;
  payer_name: string | null;
  momo_ref: string | null;
}

interface ParseError {
  id: string;
  received_at: string;
  sender_phone: string;
  sms_text: string;
  parse_error: string | null;
}

interface PreviewListProps {
  title: string;
  type: 'unallocated' | 'parse_error';
  items: UnallocatedTransaction[] | ParseError[];
  onViewAll: () => void;
  onItemClick?: (id: string) => void;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatAmount = (amount: number, currency: string = 'RWF') => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const PreviewList: React.FC<PreviewListProps> = ({
  title,
  type,
  items,
  onViewAll,
  onItemClick
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="p-8 text-center text-slate-400">
          <p className="text-sm">No items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View all <ChevronRight size={14} />
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {type === 'unallocated' && (items as UnallocatedTransaction[]).map(tx => (
          <div
            key={tx.id}
            onClick={() => onItemClick?.(tx.id)}
            className={`px-5 py-3 hover:bg-slate-50 transition-colors ${onItemClick ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-semibold shrink-0">
                  ?
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {tx.payer_name || tx.payer_phone || 'Unknown payer'}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} />
                    {formatTime(tx.occurred_at)}
                    {tx.momo_ref && <span className="text-slate-400">• {tx.momo_ref}</span>}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-900 shrink-0 ml-3">
                {formatAmount(tx.amount, tx.currency)}
              </p>
            </div>
          </div>
        ))}
        
        {type === 'parse_error' && (items as ParseError[]).map(err => (
          <div
            key={err.id}
            onClick={() => onItemClick?.(err.id)}
            className={`px-5 py-3 hover:bg-slate-50 transition-colors ${onItemClick ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs shrink-0">
                ✕
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    {err.sender_phone}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatTime(err.received_at)}
                  </p>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {err.sms_text}
                </p>
                {err.parse_error && (
                  <p className="text-xs text-red-600 mt-1">
                    {err.parse_error}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewList;

