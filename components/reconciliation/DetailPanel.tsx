import React, { useState } from 'react';
import { X, Clock, DollarSign, Phone, Hash, FileText, History, AlertTriangle, Copy, Check, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MemberSearchPicker from './MemberSearchPicker';
import type { ReconciliationTab } from './ReconciliationTabs';

interface Transaction {
  id: string;
  occurred_at: string;
  amount: number;
  payer_phone?: string;
  payer_name?: string;
  momo_ref?: string;
  momo_tx_id?: string;
  allocation_status: string;
  member_id?: string;
  group_id?: string;
  parse_confidence?: number;
  source_sms_id?: string;
  sms_text?: string;
}

interface ParseError {
  id: string;
  received_at: string;
  sender_phone: string;
  sms_text: string;
  parse_error?: string;
  parse_status: string;
  resolution_status?: string;
  resolution_note?: string;
  institution_id?: string;
}

interface DuplicateGroup {
  match_key: string;
  match_type: string;
  transaction_ids: string[];
  dupe_count: number;
  transactions?: Transaction[];
}

interface DetailPanelProps {
  type: ReconciliationTab;
  item: Transaction | ParseError | DuplicateGroup | null;
  institutionId: string;
  onClose: () => void;
  onActionComplete: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  type,
  item,
  institutionId,
  onClose,
  onActionComplete,
}) => {
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCanonicalId, setSelectedCanonicalId] = useState<string | null>(null);
  const [duplicateReason, setDuplicateReason] = useState('');
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select an item to view details</p>
        </div>
      </div>
    );
  }

  const handleAllocate = async (member: { id: string; group_id: string }) => {
    if (type !== 'unallocated') return;
    const tx = item as Transaction;
    
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('allocate_transaction', {
        p_transaction_id: tx.id,
        p_member_id: member.id,
        p_note: 'Allocated from reconciliation queue',
      });

      if (rpcError) throw rpcError;
      setShowMemberPicker(false);
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to allocate transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryParse = async () => {
    if (type !== 'parse-errors') return;
    const sms = item as ParseError;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('retry_parse_sms', {
        p_sms_id: sms.id,
      });

      if (rpcError) throw rpcError;

      // If retry_parse_sms returns the SMS data, call the Edge Function
      if (data?.sms_text) {
        const { error: parseError } = await supabase.functions.invoke('parse-momo-sms', {
          body: {
            sms_id: sms.id,
            sms_text: data.sms_text,
            sender_phone: data.sender_phone,
            institution_id: data.institution_id,
          },
        });
        if (parseError) throw parseError;
      }

      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to retry parsing');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveError = async (resolution: 'ignored' | 'not_payment') => {
    if (type !== 'parse-errors') return;
    const sms = item as ParseError;
    
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('resolve_sms_error', {
        p_sms_id: sms.id,
        p_resolution: resolution,
        p_note: resolveNote || null,
      });

      if (rpcError) throw rpcError;
      setResolveNote('');
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDuplicate = async (transactionId: string) => {
    if (type !== 'duplicates' || !selectedCanonicalId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('mark_transaction_duplicate', {
        p_transaction_id: transactionId,
        p_canonical_id: selectedCanonicalId,
        p_reason: duplicateReason || null,
      });

      if (rpcError) throw rpcError;
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to mark as duplicate');
    } finally {
      setLoading(false);
    }
  };

  // Render based on type
  if (type === 'unallocated') {
    const tx = item as Transaction;
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Transaction Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded lg:hidden">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-green-600" />
              <span className="text-2xl font-bold text-slate-900">
                {tx.amount?.toLocaleString()} RWF
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Time:</span>
                <div className="font-medium">{new Date(tx.occurred_at).toLocaleString()}</div>
              </div>
              {tx.payer_phone && (
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <div className="font-medium">{tx.payer_phone}</div>
                </div>
              )}
              {tx.payer_name && (
                <div>
                  <span className="text-slate-500">Payer:</span>
                  <div className="font-medium">{tx.payer_name}</div>
                </div>
              )}
              {tx.momo_ref && (
                <div>
                  <span className="text-slate-500">MoMo Ref:</span>
                  <div className="font-medium font-mono text-xs">{tx.momo_ref}</div>
                </div>
              )}
            </div>
            {tx.parse_confidence !== undefined && (
              <div className="text-xs text-slate-500">
                Parse confidence: {Math.round(tx.parse_confidence * 100)}%
              </div>
            )}
          </div>

          {/* Raw SMS */}
          {tx.sms_text && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Raw SMS</h4>
              <div className="bg-slate-100 rounded-lg p-3 text-sm font-mono text-slate-600 break-words">
                {tx.sms_text}
              </div>
            </div>
          )}

          {/* Allocation section */}
          {showMemberPicker ? (
            <MemberSearchPicker
              institutionId={institutionId}
              onSelect={handleAllocate}
              onCancel={() => setShowMemberPicker(false)}
            />
          ) : (
            <button
              onClick={() => setShowMemberPicker(true)}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Allocating...' : 'Allocate to Member'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'parse-errors') {
    const sms = item as ParseError;
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Parse Error Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded lg:hidden">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Error info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle size={18} />
              <span className="font-medium">Parse Failed</span>
            </div>
            <p className="text-sm text-red-600">{sms.parse_error || 'Unknown error'}</p>
          </div>

          {/* SMS details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <span className="text-slate-500">Received:</span>
              <span className="font-medium">{new Date(sms.received_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-slate-400" />
              <span className="text-slate-500">From:</span>
              <span className="font-medium">{sms.sender_phone}</span>
            </div>
          </div>

          {/* Raw SMS */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">SMS Text</h4>
            <div className="bg-slate-100 rounded-lg p-3 text-sm font-mono text-slate-600 break-words">
              {sms.sms_text}
            </div>
          </div>

          {/* Resolution note */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Resolution Note (optional)
            </label>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="Add a note about this resolution..."
              className="w-full p-3 border border-slate-300 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleRetryParse}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Retrying...' : 'Retry Parse'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleResolveError('not_payment')}
                disabled={loading}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                Not a Payment
              </button>
              <button
                onClick={() => handleResolveError('ignored')}
                disabled={loading}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'duplicates') {
    const group = item as DuplicateGroup;
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Duplicate Group</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded lg:hidden">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Match info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <Copy size={18} />
              <span className="font-medium">{group.dupe_count} Potential Duplicates</span>
            </div>
            <p className="text-sm text-amber-600">
              Match type: <span className="font-mono">{group.match_type}</span>
            </p>
            <p className="text-xs text-amber-500 mt-1 font-mono break-all">
              Key: {group.match_key}
            </p>
          </div>

          {/* Instructions */}
          <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">How to resolve:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Select the canonical (correct) transaction</li>
              <li>Mark the others as duplicates</li>
            </ol>
          </div>

          {/* Transactions in group */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Transactions in this group:</h4>
            {group.transactions?.map((tx) => (
              <div
                key={tx.id}
                className={`border rounded-lg p-3 transition-all ${
                  selectedCanonicalId === tx.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">
                    {tx.amount?.toLocaleString()} RWF
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(tx.occurred_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-slate-600 mb-2">
                  {tx.payer_phone} {tx.payer_name && `• ${tx.payer_name}`}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCanonicalId(tx.id)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      selectedCanonicalId === tx.id
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedCanonicalId === tx.id ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check size={12} /> Canonical
                      </span>
                    ) : (
                      'Set as Canonical'
                    )}
                  </button>
                  {selectedCanonicalId && selectedCanonicalId !== tx.id && (
                    <button
                      onClick={() => handleMarkDuplicate(tx.id)}
                      disabled={loading}
                      className="flex-1 px-3 py-1.5 text-xs font-medium bg-amber-100 hover:bg-amber-200 text-amber-700 rounded transition-colors disabled:opacity-50"
                    >
                      Mark Duplicate
                    </button>
                  )}
                </div>
              </div>
            ))}

            {!group.transactions?.length && (
              <p className="text-sm text-slate-400">Loading transactions...</p>
            )}
          </div>

          {/* Duplicate reason */}
          {selectedCanonicalId && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Duplicate Reason (optional)
              </label>
              <input
                type="text"
                value={duplicateReason}
                onChange={(e) => setDuplicateReason(e.target.value)}
                placeholder="e.g., Same transaction sent twice"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default DetailPanel;

