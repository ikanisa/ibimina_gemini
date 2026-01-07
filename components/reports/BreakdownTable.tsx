import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreakdownRow {
  id: string;
  name: string;
  code?: string;
  transactionCount: number;
  totalAmount: number;
  allocatedAmount?: number;
  unallocatedCount?: number;
}

interface BreakdownTableProps {
  title: string;
  rows: BreakdownRow[];
  onRowClick?: (id: string) => void;
  emptyMessage?: string;
  currency?: string;
}

export const BreakdownTable: React.FC<BreakdownTableProps> = ({
  title,
  rows,
  onRowClick,
  emptyMessage = 'No data available',
  currency = 'RWF'
}) => {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
        <p className="text-sm text-slate-500 text-center py-8">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Transactions</th>
              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Amount</th>
              {rows.some(r => r.unallocatedCount !== undefined) && (
                <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Unallocated</th>
              )}
              {onRowClick && <th className="px-4 py-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr 
                key={row.id}
                onClick={() => onRowClick?.(row.id)}
                className={onRowClick ? 'hover:bg-slate-50 cursor-pointer transition-colors' : ''}
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{row.name}</div>
                  {row.code && (
                    <div className="text-xs text-slate-500 font-mono">{row.code}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right tabular-nums">
                  {row.transactionCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right tabular-nums">
                  {row.totalAmount.toLocaleString()} {currency}
                </td>
                {row.unallocatedCount !== undefined && (
                  <td className="px-4 py-3 text-right">
                    {row.unallocatedCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {row.unallocatedCount}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                )}
                {onRowClick && (
                  <td className="px-4 py-3 text-slate-400">
                    <ChevronRight size={16} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

