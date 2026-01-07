/**
 * Payments.tsx - Consolidated Payments & Ledger Management
 * 
 * Merges:
 * - MoMo SMS Parsing
 * - Payment Ledger entries
 * - Contributions (linked to groups)
 * 
 * Single unified view for all payment-related operations
 * Uses infinite scroll (lazy loading) instead of pagination
 */
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    MessageSquare, CheckCircle2, AlertCircle,
    RefreshCw, CreditCard, TrendingUp, TrendingDown,
    Search, Eye, Link2,
    DollarSign, FileText, X, Loader2
} from 'lucide-react';
import { SupabaseSmsMessage } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PaymentRecord {
    id: string;
    type: 'SMS' | 'LEDGER' | 'CONTRIBUTION';
    timestamp: string;
    amount: number;
    currency: string;
    source: string;
    description: string;
    status: 'RECONCILED' | 'UNRECONCILED' | 'PENDING' | 'FLAGGED';
    reference?: string;
    memberId?: string;
    memberName?: string;
    groupId?: string;
    groupName?: string;
    rawData?: any;
}

type PaymentTab = 'All Payments' | 'SMS Messages' | 'Contributions' | 'Ledger';

const INITIAL_LOAD = 50;
const LOAD_MORE = 25;

const Payments: React.FC = () => {
    const { institutionId } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    // Data state
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    // UI state
    const [activeTab, setActiveTab] = useState<PaymentTab>('All Payments');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Stats
    const [stats, setStats] = useState({
        totalInflow: 0,
        totalOutflow: 0,
        pendingReconciliation: 0,
        todayTransactions: 0
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load unified payment data
    const loadPayments = useCallback(async (loadOffset: number = 0, limit: number = INITIAL_LOAD, append: boolean = false) => {
        if (!institutionId) {
            setPayments([]);
            setLoading(false);
            return;
        }

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const allPayments: PaymentRecord[] = [];

            // Fetch based on active tab
            if (activeTab === 'All Payments' || activeTab === 'SMS Messages') {
                // Fetch SMS messages
                let smsQuery = supabase
                    .from('sms_messages')
                    .select('*')
                    .eq('institution_id', institutionId)
                    .order('timestamp', { ascending: false })
                    .range(loadOffset, loadOffset + limit - 1);

                const { data: smsData, error: smsError } = await smsQuery;

                if (smsError) {
                    console.error('SMS fetch error:', smsError);
                } else if (smsData) {
                    const smsMapped: PaymentRecord[] = smsData.map((sms: SupabaseSmsMessage) => ({
                        id: sms.id,
                        type: 'SMS' as const,
                        timestamp: sms.timestamp,
                        amount: sms.parsed_amount || 0,
                        currency: sms.parsed_currency || 'RWF',
                        source: sms.sender,
                        description: sms.body.substring(0, 100) + (sms.body.length > 100 ? '...' : ''),
                        status: sms.linked_transaction_id ? 'RECONCILED' : (sms.is_parsed ? 'PENDING' : 'UNRECONCILED'),
                        reference: sms.parsed_transaction_id || undefined,
                        rawData: sms
                    }));
                    allPayments.push(...smsMapped);
                }
            }

            if (activeTab === 'All Payments' || activeTab === 'Ledger') {
                // Fetch payment ledger
                let ledgerQuery = supabase
                    .from('payment_ledger')
                    .select('*')
                    .eq('institution_id', institutionId)
                    .order('created_at', { ascending: false })
                    .range(loadOffset, loadOffset + limit - 1);

                const { data: ledgerData, error: ledgerError } = await ledgerQuery;

                if (ledgerError) {
                    console.error('Ledger fetch error:', ledgerError);
                } else if (ledgerData) {
                    const ledgerMapped: PaymentRecord[] = ledgerData.map((tx: any) => ({
                        id: tx.id,
                        type: 'LEDGER' as const,
                        timestamp: tx.timestamp || tx.created_at,
                        amount: tx.amount || 0,
                        currency: tx.currency || 'RWF',
                        source: tx.counterparty || 'System',
                        description: `${tx.txn_type}: ${tx.reference || 'No reference'}`,
                        status: tx.reconciled ? 'RECONCILED' : (tx.status === 'FLAGGED' ? 'FLAGGED' : 'PENDING'),
                        reference: tx.txn_id || tx.reference,
                        memberId: tx.member_id,
                        rawData: tx
                    }));
                    allPayments.push(...ledgerMapped);
                }
            }

            if (activeTab === 'All Payments' || activeTab === 'Contributions') {
                // Fetch contributions
                let contribQuery = supabase
                    .from('contributions')
                    .select(`
                        *,
                        members ( full_name ),
                        groups ( group_name )
                    `)
                    .eq('institution_id', institutionId)
                    .order('date', { ascending: false })
                    .range(loadOffset, loadOffset + limit - 1);

                const { data: contribData, error: contribError } = await contribQuery;

                if (contribError) {
                    console.error('Contributions fetch error:', contribError);
                } else if (contribData) {
                    const contribMapped: PaymentRecord[] = contribData.map((c: any) => ({
                        id: c.id,
                        type: 'CONTRIBUTION' as const,
                        timestamp: c.date,
                        amount: c.amount || 0,
                        currency: 'RWF',
                        source: c.method || 'Cash',
                        description: `Contribution from ${c.members?.full_name || 'Unknown'} to ${c.groups?.group_name || 'Unknown Group'}`,
                        status: c.status === 'RECONCILED' ? 'RECONCILED' : (c.status === 'FLAGGED' ? 'FLAGGED' : 'PENDING'),
                        reference: c.reference,
                        memberId: c.member_id,
                        memberName: c.members?.full_name,
                        groupId: c.group_id,
                        groupName: c.groups?.group_name,
                        rawData: c
                    }));
                    allPayments.push(...contribMapped);
                }
            }

            // Sort all by timestamp (desc)
            allPayments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            if (append) {
                setPayments(prev => [...prev, ...allPayments]);
            } else {
                setPayments(allPayments);
                
                // Calculate stats only on initial load
                const inflow = allPayments.filter(p => p.amount > 0).reduce((sum, p) => sum + p.amount, 0);
                const outflow = allPayments.filter(p => p.amount < 0).reduce((sum, p) => sum + Math.abs(p.amount), 0);
                const pending = allPayments.filter(p => p.status === 'PENDING' || p.status === 'UNRECONCILED').length;
                const today = new Date().toISOString().split('T')[0];
                const todayTx = allPayments.filter(p => p.timestamp.startsWith(today)).length;
                setStats({ totalInflow: inflow, totalOutflow: outflow, pendingReconciliation: pending, todayTransactions: todayTx });
            }

            setOffset(loadOffset + allPayments.length);
            setHasMore(allPayments.length === limit);

        } catch (err) {
            console.error('Error loading payments:', err);
            setError('Failed to load payment data');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            loadingRef.current = false;
        }
    }, [institutionId, activeTab]);

    // Initial load and tab change
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        setPayments([]);
        loadPayments(0, INITIAL_LOAD, false);
    }, [loadPayments, activeTab]);

    // Load more function
    const loadMore = useCallback(() => {
        if (loadingRef.current || !hasMore || loading) return;
        loadingRef.current = true;
        loadPayments(offset, LOAD_MORE, true);
    }, [offset, hasMore, loading, loadPayments]);

    // Infinite scroll handler
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (loadingRef.current || !hasMore) return;
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop - clientHeight < 300) {
                loadMore();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadMore]);

    // Filter payments (client-side for already loaded data)
    const filteredPayments = useMemo(() => {
        let filtered = payments;
        
        if (debouncedSearch) {
            const search = debouncedSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.description.toLowerCase().includes(search) ||
                p.source.toLowerCase().includes(search) ||
                p.reference?.toLowerCase().includes(search) ||
                p.memberName?.toLowerCase().includes(search)
            );
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        return filtered;
    }, [payments, debouncedSearch, statusFilter]);

    // Link SMS to transaction
    const handleLinkSms = async (payment: PaymentRecord) => {
        if (payment.type !== 'SMS' || !payment.rawData) return;

        // Create transaction from SMS
        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .insert({
                institution_id: institutionId,
                type: 'Deposit',
                amount: payment.amount,
                currency: payment.currency,
                channel: 'MoMo',
                status: 'COMPLETED',
                reference: payment.reference || `SMS-${payment.id.slice(0, 8)}`
            })
            .select()
            .single();

        if (txError) {
            setError(`Failed to create transaction: ${txError.message}`);
            return;
        }

        // Link SMS to transaction
        const { error: linkError } = await supabase
            .from('sms_messages')
            .update({ linked_transaction_id: txData.id })
            .eq('id', payment.id);

        if (linkError) {
            setError(`Failed to link SMS: ${linkError.message}`);
            return;
        }

        // Refresh
        setOffset(0);
        setHasMore(true);
        loadPayments(0, INITIAL_LOAD, false);
        setSelectedPayment(null);
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
            {/* Header Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <TrendingUp className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Total Inflow</p>
                            <p className="text-lg font-bold text-slate-900">{stats.totalInflow.toLocaleString()} <span className="text-xs font-normal">RWF</span></p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <TrendingDown className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Total Outflow</p>
                            <p className="text-lg font-bold text-slate-900">{stats.totalOutflow.toLocaleString()} <span className="text-xs font-normal">RWF</span></p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <AlertCircle className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Pending</p>
                            <p className="text-lg font-bold text-slate-900">{stats.pendingReconciliation}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <CreditCard className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Today</p>
                            <p className="text-lg font-bold text-slate-900">{stats.todayTransactions} <span className="text-xs font-normal">transactions</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between flex-shrink-0">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X size={16} /></button>
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 overflow-x-auto flex-shrink-0">
                    {(['All Payments', 'SMS Messages', 'Contributions', 'Ledger'] as PaymentTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="p-3 border-b border-slate-100 flex flex-wrap items-center gap-3 flex-shrink-0">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                        <option value="ALL">All Status</option>
                        <option value="RECONCILED">Reconciled</option>
                        <option value="PENDING">Pending</option>
                        <option value="UNRECONCILED">Unreconciled</option>
                        <option value="FLAGGED">Flagged</option>
                    </select>
                    <button
                        onClick={() => {
                            setOffset(0);
                            setHasMore(true);
                            loadPayments(0, INITIAL_LOAD, false);
                        }}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <span className="text-xs text-slate-500">{payments.length} loaded</span>
                </div>

                {/* Table with infinite scroll */}
                <div ref={containerRef} className="flex-1 overflow-auto">
                    {loading && payments.length === 0 ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="flex items-center gap-3 text-slate-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-sm">Loading payments...</span>
                            </div>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="p-12 text-center">
                            <CreditCard className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-500 text-sm">No payments found</p>
                        </div>
                    ) : (
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date/Time</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Source</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPayments.map(payment => (
                                    <tr
                                        key={payment.id}
                                        onClick={() => setSelectedPayment(payment)}
                                        className={`hover:bg-blue-50/50 cursor-pointer ${selectedPayment?.id === payment.id ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${payment.type === 'SMS' ? 'bg-purple-50 text-purple-700' :
                                                payment.type === 'CONTRIBUTION' ? 'bg-green-50 text-green-700' :
                                                    'bg-blue-50 text-blue-700'
                                            }`}>
                                                {payment.type === 'SMS' && <MessageSquare size={12} className="mr-1" />}
                                                {payment.type === 'CONTRIBUTION' && <DollarSign size={12} className="mr-1" />}
                                                {payment.type === 'LEDGER' && <FileText size={12} className="mr-1" />}
                                                {payment.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(payment.timestamp).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">{payment.source}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{payment.description}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-sm font-semibold ${payment.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {payment.amount >= 0 ? '+' : ''}{payment.amount.toLocaleString()} {payment.currency}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${payment.status === 'RECONCILED' ? 'bg-green-50 text-green-700' :
                                                payment.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                                                    payment.status === 'FLAGGED' ? 'bg-red-50 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                            }`}>
                                                {payment.status === 'RECONCILED' && <CheckCircle2 size={10} className="mr-1" />}
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Eye size={16} className="text-slate-400" />
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Loading more indicator */}
                                {loadingMore && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-500">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span className="text-sm">Loading more...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                
                                {/* End of list indicator */}
                                {!hasMore && payments.length > 0 && !debouncedSearch && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-4 text-center text-sm text-slate-400">
                                            All {payments.length} payments loaded
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Detail Panel */}
            {selectedPayment && (
                <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl border-l border-slate-200 z-40 flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-900">Payment Details</h3>
                        <button onClick={() => setSelectedPayment(null)} className="p-1 hover:bg-slate-200 rounded">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                            <p className="text-xs text-blue-600 font-medium uppercase mb-1">Amount</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Type</span>
                                <span className="font-medium text-slate-900">{selectedPayment.type}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Source</span>
                                <span className="font-medium text-slate-900">{selectedPayment.source}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium text-slate-900">
                                    {new Date(selectedPayment.timestamp).toLocaleString()}
                                </span>
                            </div>
                            {selectedPayment.reference && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Reference</span>
                                    <span className="font-mono text-slate-900">{selectedPayment.reference}</span>
                                </div>
                            )}
                            {selectedPayment.memberName && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Member</span>
                                    <span className="font-medium text-slate-900">{selectedPayment.memberName}</span>
                                </div>
                            )}
                            {selectedPayment.groupName && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Group</span>
                                    <span className="font-medium text-slate-900">{selectedPayment.groupName}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-500 font-medium uppercase mb-2">Description</p>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                                {selectedPayment.description}
                            </p>
                        </div>

                        {/* Actions */}
                        {selectedPayment.type === 'SMS' && selectedPayment.status !== 'RECONCILED' && selectedPayment.amount > 0 && (
                            <button
                                onClick={() => handleLinkSms(selectedPayment)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                            >
                                <Link2 size={16} />
                                Create Transaction & Link
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
