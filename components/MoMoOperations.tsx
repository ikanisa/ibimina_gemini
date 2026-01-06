
import React, { useEffect, useState, useMemo } from 'react';
import { MessageSquare, CheckCircle2, AlertCircle, ArrowRight, Cpu, LayoutList, Table as TableIcon, RefreshCw } from 'lucide-react';
import { MOCK_SMS } from '../constants';
import { SmsMessage, SupabaseSmsMessage } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSmsMessages } from '../hooks';
import { LoadingSpinner, ErrorDisplay, EmptyState, Button, Badge } from './ui';

const MoMoOperations: React.FC = () => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();

  // Use the new hook for SMS messages
  const {
    messages: supabaseMessages,
    loading: smsLoading,
    error: smsError,
    refetch: refetchSms,
    linkToTransaction: linkSmsToTransaction
  } = useSmsMessages({
    autoFetch: !useMockData
  });

  // Transform Supabase messages to UI format
  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    return `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`;
  };

  const smsRecords = useMemo(() => {
    if (useMockData) return MOCK_SMS;
    if (!supabaseMessages.length) return [];

    return supabaseMessages.map((sms: SupabaseSmsMessage) => ({
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
  }, [useMockData, supabaseMessages]);

  const [smsViewMode, setSmsViewMode] = useState<'split' | 'table'>('split');
  const [selectedSms, setSelectedSms] = useState<SmsMessage | null>(null);
  const [isCreatingTx, setIsCreatingTx] = useState(false);

  // Handle Create Transaction from parsed SMS
  const handleCreateTransaction = async () => {
    if (!selectedSms || !selectedSms.parsedData || !institutionId) return;

    setIsCreatingTx(true);

    try {
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

      // Link the transaction to the SMS record using the hook method
      await linkSmsToTransaction(selectedSms.id, txData.id);

      // Update selected SMS to reflect the link
      setSelectedSms(prev => prev ? { ...prev, linkedTransactionId: txData.id } : null);

      // Refetch to update the list
      await refetchSms();
    } catch (err) {
      console.error('Error in handleCreateTransaction:', err);
    } finally {
      setIsCreatingTx(false);
    }
  };

  // Set first SMS as selected when records load
  useEffect(() => {
    if (smsRecords.length > 0 && !selectedSms) {
      setSelectedSms(smsRecords[0]);
    }
  }, [smsRecords, selectedSms]);

  const handleRefresh = () => {
    refetchSms();
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Error Display */}
      {smsError && (
        <ErrorDisplay error={smsError} variant="banner" />
      )}
      {/* Loading State */}
      {smsLoading && (
        <LoadingSpinner size="lg" text="Loading SMS messages..." className="h-32" />
      )}
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" />
            MoMo SMS Inbox & Parsing
          </h2>
          <p className="text-sm text-slate-500">
            AI-powered parsing of incoming Mobile Money notification messages.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          isLoading={smsLoading}
        >
          Sync Inbox
        </Button>
      </div>

      {/* SMS Parsing View */}
      <div className="space-y-4 flex-1 flex flex-col">
        {/* View Mode Toggle */}
        <div className="flex justify-end gap-2 shrink-0">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setSmsViewMode('split')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all min-h-[44px] touch-manipulation ${smsViewMode === 'split' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'text-slate-500 hover:bg-slate-50 active:scale-[0.98]'}`}
            >
              <LayoutList size={14} /> Split View
            </button>
            <button
              onClick={() => setSmsViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all min-h-[44px] touch-manipulation ${smsViewMode === 'table' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'text-slate-500 hover:bg-slate-50 active:scale-[0.98]'}`}
            >
              <TableIcon size={14} /> Table View
            </button>
          </div>
        </div>

        {smsViewMode === 'split' ? (
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 overflow-hidden">
            {/* Inbox List */}
            <div className="w-full md:w-1/2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-700">SMS Inbox</h3>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Live Sync</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {smsRecords.map(sms => (
                  <div
                    key={sms.id}
                    onClick={() => setSelectedSms(sms)}
                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-all duration-150 touch-manipulation min-h-[60px] ${selectedSms?.id === sms.id ? 'bg-blue-50 border-l-4 border-l-blue-500 ring-2 ring-blue-200' : 'border-l-4 border-l-transparent'}`}
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
                {smsRecords.length === 0 && !smsLoading && (
                  <EmptyState
                    icon={MessageSquare}
                    title={useMockData ? 'No SMS messages' : 'No SMS data yet'}
                    description={useMockData
                      ? 'No SMS messages available.'
                      : 'Connect this module to Supabase to see SMS messages.'}
                  />
                )}
              </div>
            </div>

            {/* Parsing Details */}
            <div className="w-full md:w-1/2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden relative">
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
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleCreateTransaction}
                              isLoading={isCreatingTx}
                            >
                              Create Transaction
                            </Button>
                          ) : (
                            <Badge variant="success" className="flex items-center gap-2">
                              <CheckCircle2 size={16} /> Linked to {selectedSms.linkedTransactionId.slice(0, 8)}...
                            </Badge>
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
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1">
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
                        <Badge
                          variant={sms.isParsed ? 'success' : 'warning'}
                          className="flex items-center gap-1 w-fit"
                        >
                          {sms.isParsed ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {sms.isParsed ? 'Parsed' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sms.linkedTransactionId ? (
                          <Badge variant="info" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 size={12} /> {sms.linkedTransactionId.slice(0, 8)}...
                          </Badge>
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
                  {smsRecords.length === 0 && !smsLoading && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={MessageSquare}
                          title={useMockData ? 'No SMS messages' : 'No SMS data yet'}
                          description={useMockData
                            ? 'No SMS messages match your criteria.'
                            : 'Connect this module to Supabase to see SMS messages.'}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoMoOperations;
