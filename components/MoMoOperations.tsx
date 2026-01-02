
import React, { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle2, AlertCircle, ArrowRight, Cpu, Smartphone, LayoutList, Table as TableIcon, RefreshCw } from 'lucide-react';
import { MOCK_SMS, MOCK_NFC_LOGS } from '../constants';
import { SmsMessage, NfcLog, SupabaseNfcLog, SupabaseSmsMessage } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MoMoOperationsProps {
  mode?: 'sms' | 'nfc'; // 'sms' for Staff, 'nfc' for Admin logs
}

const MoMoOperations: React.FC<MoMoOperationsProps> = ({ mode = 'sms' }) => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  const [smsViewMode, setSmsViewMode] = useState<'split' | 'table'>('split');
  const [selectedSms, setSelectedSms] = useState<SmsMessage | null>(null);
  const [smsRecords, setSmsRecords] = useState<SmsMessage[]>(useMockData ? MOCK_SMS : []);
  const [nfcRecords, setNfcRecords] = useState<NfcLog[]>(useMockData ? MOCK_NFC_LOGS : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isCreatingTx, setIsCreatingTx] = useState(false);

  // Handle Create Transaction from parsed SMS
  const handleCreateTransaction = async () => {
    if (!selectedSms || !selectedSms.parsedData || !institutionId) return;

    setIsCreatingTx(true);

    // Create transaction from parsed SMS data
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        institution_id: institutionId,
        type: 'Deposit',
        amount: selectedSms.parsedData.amount,
        currency: selectedSms.parsedData.currency || 'RWF',
        channel: 'MoMo',
        status: 'COMPLETED',
        reference: selectedSms.parsedData.transactionId || `SMS-${selectedSms.id.slice(0, 8)}`
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      setIsCreatingTx(false);
      return;
    }

    // Link the transaction to the SMS record
    const { error: linkError } = await supabase
      .from('payment_ledger')
      .update({ linked_transaction_id: txData.id })
      .eq('id', selectedSms.id);

    if (linkError) {
      console.error('Error linking transaction to SMS:', linkError);
    }

    // Update local state
    setSmsRecords(prev => prev.map(sms =>
      sms.id === selectedSms.id
        ? { ...sms, linkedTransactionId: txData.id }
        : sms
    ));
    setSelectedSms(prev => prev ? { ...prev, linkedTransactionId: txData.id } : null);
    setIsCreatingTx(false);
  };

  useEffect(() => {
    if (useMockData) {
      setSmsRecords(MOCK_SMS);
      setNfcRecords(MOCK_NFC_LOGS);
      return;
    }

    if (!institutionId) {
      setSmsRecords([]);
      setNfcRecords([]);
      return;
    }

    const formatTimestamp = (value: string) => {
      const date = new Date(value);
      return `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`;
    };

    const loadData = async () => {
      setLoading(true);
      setError(null);

      if (mode === 'sms') {
        const { data, error } = await supabase
          .from('payment_ledger')
          .select('*')
          .eq('institution_id', institutionId)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error loading SMS messages:', error);
          setError('Unable to load SMS messages. Check your connection and permissions.');
          setSmsRecords([]);
          setLoading(false);
          return;
        }

        const mapped = (data as SupabaseSmsMessage[]).map((sms) => ({
          id: sms.id,
          sender: sms.sender,
          timestamp: formatTimestamp(sms.timestamp),
          body: sms.body,
          isParsed: sms.is_parsed,
          parsedData: sms.is_parsed
            ? {
              amount: Number(sms.parsed_amount ?? 0),
              currency: sms.parsed_currency ?? 'RWF',
              transactionId: sms.parsed_transaction_id ?? '',
              counterparty: sms.parsed_counterparty ?? ''
            }
            : undefined,
          linkedTransactionId: sms.linked_transaction_id ?? undefined
        }));

        setSmsRecords(mapped);
        setSelectedSms(mapped[0] ?? null);
      }

      if (mode === 'nfc') {
        const { data, error } = await supabase
          .from('nfc_logs')
          .select('*')
          .eq('institution_id', institutionId)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error loading NFC logs:', error);
          setError('Unable to load NFC logs. Check your connection and permissions.');
          setNfcRecords([]);
          setLoading(false);
          return;
        }

        const mapped = (data as SupabaseNfcLog[]).map((log) => {
          const normalizedStatus = log.status.toUpperCase().replace(/\s+/g, '_');
          const statusLabel: NfcLog['status'] =
            normalizedStatus === 'SUCCESS'
              ? 'Success'
              : normalizedStatus === 'FAILED'
                ? 'Failed'
                : 'Pending SMS';
          return {
            id: log.id,
            timestamp: formatTimestamp(log.timestamp),
            deviceId: log.device_id,
            tagId: log.tag_id,
            action: log.action,
            status: statusLabel,
            memberId: log.member_id ?? undefined,
            amount: log.amount ?? undefined,
            linkedSms: log.linked_sms
          };
        });

        setNfcRecords(mapped);
      }

      setLoading(false);
    };

    loadData();
  }, [useMockData, institutionId, mode, refreshToken]);

  const handleRefresh = () => {
    setRefreshToken((prev) => prev + 1);
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
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {mode === 'nfc' ? <Smartphone className="text-blue-600" /> : <MessageSquare className="text-blue-600" />}
            {mode === 'nfc' ? 'NFC & USSD System Logs' : 'MoMo SMS Inbox & Parsing'}
          </h2>
          <p className="text-sm text-slate-500">
            {mode === 'nfc'
              ? 'System-wide audit trail of all NFC tag interactions and USSD sessions.'
              : 'AI-powered parsing of incoming Mobile Money notification messages.'}
          </p>
        </div>
        {mode === 'sms' && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} /> Sync Inbox
          </button>
        )}
      </div>

      {/* NFC View (Admin Only) */}
      {mode === 'nfc' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Date & Time</div>
            <div className="col-span-2">Member</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-3">Device / Tag</div>
            <div className="col-span-1">SMS Link</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          <div className="overflow-y-auto flex-1">
            {nfcRecords.map(log => (
              <div key={log.id} className="grid grid-cols-12 px-6 py-4 items-center border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="col-span-2 text-sm text-slate-900">{log.timestamp}</div>
                <div className="col-span-2 text-sm text-slate-600">{log.memberId || 'Unknown'}</div>
                <div className="col-span-2 text-sm font-medium text-slate-900">{log.amount ? `${log.amount.toLocaleString()} RWF` : '-'}</div>
                <div className="col-span-3">
                  <div className="text-xs text-slate-500">Dev: {log.deviceId}</div>
                  <div className="text-xs font-mono bg-slate-100 px-1 rounded w-fit mt-0.5">{log.tagId}</div>
                </div>
                <div className="col-span-1">
                  {log.linkedSms ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </div>
                <div className="col-span-2 text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${log.status === 'Success' ? 'bg-green-100 text-green-700' :
                    log.status === 'Pending SMS' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {nfcRecords.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-sm">
              {useMockData ? 'No NFC logs found.' : 'No NFC logs yet. Connect this module to Supabase.'}
            </div>
          )}
        </div>
      )}

      {/* SMS Parsing View (Staff) */}
      {mode === 'sms' && (
        <div className="space-y-4 flex-1 flex flex-col">
          {/* View Mode Toggle */}
          <div className="flex justify-end gap-2 shrink-0">
            <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1 shadow-sm">
              <button
                onClick={() => setSmsViewMode('split')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${smsViewMode === 'split' ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <LayoutList size={14} /> Split View
              </button>
              <button
                onClick={() => setSmsViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${smsViewMode === 'table' ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <TableIcon size={14} /> Table View
              </button>
            </div>
          </div>

          {smsViewMode === 'split' ? (
            <div className="flex gap-6 flex-1 overflow-hidden">
              {/* Inbox List */}
              <div className="w-1/2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-700">SMS Inbox</h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Live Sync</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {smsRecords.map(sms => (
                    <div
                      key={sms.id}
                      onClick={() => setSelectedSms(sms)}
                      className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-blue-50 transition-colors ${selectedSms?.id === sms.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-sm text-slate-900">{sms.sender}</span>
                        <span className="text-xs text-slate-400">{sms.timestamp.split(' ')[1]}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{sms.body}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {sms.isParsed ? (
                          <span className="text-[10px] text-green-600 flex items-center gap-1"><CheckCircle2 size={10} /> Parsed</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 flex items-center gap-1"><AlertCircle size={10} /> Unparsed</span>
                        )}
                        {sms.linkedTransactionId && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">Linked</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {smsRecords.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      {useMockData ? 'No SMS messages.' : 'No SMS data yet. Connect this module to Supabase.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Parsing Details */}
              <div className="w-1/2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                {!selectedSms ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                    <Cpu size={48} className="mb-4 text-slate-200" />
                    <p>Select an SMS message to inspect AI parsing details.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <h3 className="text-sm font-semibold text-slate-700">Parser Output</h3>
                    </div>
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 font-mono text-xs text-slate-600 leading-relaxed">
                        {selectedSms.body}
                      </div>

                      <div className="relative">
                        <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2">
                          <ArrowRight size={16} className="text-slate-300 rotate-90" />
                        </div>
                      </div>

                      {selectedSms.parsedData ? (
                        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">Amount</label>
                              <p className="text-lg font-bold text-slate-900">{selectedSms.parsedData.amount.toLocaleString()} <span className="text-sm font-normal text-slate-500">{selectedSms.parsedData.currency}</span></p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">Transaction ID</label>
                              <p className="text-base font-mono font-medium text-slate-900">{selectedSms.parsedData.transactionId}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs font-medium text-slate-500 uppercase">Counterparty</label>
                              <p className="text-sm font-medium text-slate-900">{selectedSms.parsedData.counterparty}</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-blue-100 flex justify-end gap-3">
                            {!selectedSms.linkedTransactionId ? (
                              <button
                                onClick={handleCreateTransaction}
                                disabled={isCreatingTx}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isCreatingTx ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creating...
                                  </>
                                ) : (
                                  'Create Transaction'
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                                <CheckCircle2 size={16} /> Linked to {selectedSms.linkedTransactionId}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                          <p className="text-slate-500 text-sm mb-3">AI could not confidently parse this message.</p>
                          <button className="text-blue-600 font-medium text-sm hover:underline">Manually Map Fields</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
              {/* Full Table View */}
              <div className="overflow-x-auto h-full">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sender</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Message Snippet</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Parsing Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Transaction</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {smsRecords.map(sms => (
                      <tr key={sms.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{sms.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{sms.sender}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs" title={sms.body}>
                          {sms.body}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sms.isParsed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                              <CheckCircle2 size={12} /> Parsed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                              <AlertCircle size={12} /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sms.linkedTransactionId ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                              <CheckCircle2 size={12} /> {sms.linkedTransactionId}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Unlinked</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setSmsViewMode('split');
                              setSelectedSms(sms);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline flex items-center justify-end gap-1"
                          >
                            View Details <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {smsRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                          {useMockData ? 'No SMS messages.' : 'No SMS data yet. Connect this module to Supabase.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoMoOperations;
