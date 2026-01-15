/**
 * WhatsApp Messaging Component
 * Staff can manually trigger WhatsApp messages to members with comprehensive statements
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageSquare,
    Users,
    FileText,
    Send,
    Search,
    Loader2,
    CheckCircle,
    AlertCircle,
    Phone,
    Eye,
    Paperclip,
    X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { Button } from '@/shared/components/ui';
import { useMemberStatement } from '../hooks/useMemberStatement';
import { useSendWhatsApp } from '../hooks/useSendWhatsApp';
import { useGroupReport } from '../hooks/useGroupReport';
import { generateStatementMessage, generateGroupReportMessage } from '../utils/messageGenerators';
import { generateMemberStatementPDF } from '../utils/memberStatementPDF';
import type { MessageType } from '../types';

interface Member {
    id: string;
    full_name: string;
    phone: string;
    group_name?: string;
}

interface Group {
    id: string;
    group_name: string;
    member_count?: number;
}

export const WhatsAppMessaging: React.FC = () => {
    const { institutionId } = useAuth();

    // Search and selection state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [searching, setSearching] = useState(false);

    // Message type and content
    const [messageType, setMessageType] = useState<MessageType>('MEMBER_STATEMENT');
    const [customMessage, setCustomMessage] = useState('');
    const [previewMessage, setPreviewMessage] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Groups for report sending
    const [groups, setGroups] = useState<Group[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Report options
    const [reportType, setReportType] = useState<'WEEKLY' | 'MONTHLY' | 'OVERALL'>('WEEKLY');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');

    // PDF attachment option
    const [attachPdf, setAttachPdf] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Hooks
    const { statement, loading: loadingStatement, fetchStatement } = useMemberStatement();
    const { sending, result, sendMessage, reset } = useSendWhatsApp();
    const { reportData, leaders, loading: loadingReport, fetchGroupReport } = useGroupReport();

    // Load groups on mount
    useEffect(() => {
        if (institutionId) {
            loadGroups();
        }
    }, [institutionId]);

    // Set default dates
    useEffect(() => {
        const now = new Date();
        if (reportType === 'WEEKLY') {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            setPeriodStart(weekStart.toISOString().split('T')[0]);
            setPeriodEnd(now.toISOString().split('T')[0]);
        } else if (reportType === 'MONTHLY') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            setPeriodStart(monthStart.toISOString().split('T')[0]);
            setPeriodEnd(now.toISOString().split('T')[0]);
        }
    }, [reportType]);

    const loadGroups = async () => {
        if (!institutionId) return;
        setLoadingGroups(true);

        const { data, error } = await supabase
            .from('groups')
            .select('id, group_name')
            .eq('institution_id', institutionId)
            .eq('status', 'ACTIVE')
            .order('group_name');

        if (!error && data) {
            setGroups(data);
        }
        setLoadingGroups(false);
    };

    // Search members
    const searchMembers = useCallback(async (query: string) => {
        if (!institutionId || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        const { data, error } = await supabase
            .from('members')
            .select(`
        id,
        full_name,
        phone,
        group_members!inner (
          group:groups (group_name)
        )
      `)
            .eq('institution_id', institutionId)
            .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
            .limit(10);

        if (!error && data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setSearchResults((data as any[]).map((m) => ({
                id: m.id,
                full_name: m.full_name,
                phone: m.phone,
                group_name: m.group_members?.[0]?.group?.group_name,
            })));
        }
        setSearching(false);
    }, [institutionId]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                searchMembers(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchMembers]);

    // Handle member selection
    const handleSelectMember = async (member: Member) => {
        setSelectedMember(member);
        setSearchQuery('');
        setSearchResults([]);

        // Fetch statement for preview
        await fetchStatement(member.id);
    };

    // Generate preview message
    const generatePreview = () => {
        if (messageType === 'MEMBER_STATEMENT' && statement) {
            setPreviewMessage(generateStatementMessage(statement));
        } else if (messageType === 'GROUP_REPORT' && selectedGroup) {
            setPreviewMessage(generateGroupReportMessage(
                selectedGroup.group_name,
                'Leader', // Would be fetched from group leaders
                reportType,
                periodStart,
                periodEnd,
                0, // Would be calculated
                selectedGroup.member_count || 0,
                'RWF'
            ));
        } else if (messageType === 'CUSTOM_MESSAGE') {
            setPreviewMessage(customMessage);
        }
        setShowPreview(true);
    };

    // Send the message
    const handleSend = async () => {
        let phone = '';
        let recipientId = '';
        let recipientName = '';
        let message = '';
        let pdfUrl: string | undefined;
        let pdfFilename: string | undefined;

        if (messageType === 'MEMBER_STATEMENT' && selectedMember && statement) {
            phone = selectedMember.phone;
            recipientId = selectedMember.id;
            recipientName = selectedMember.full_name;
            message = generateStatementMessage(statement);

            // Generate and upload PDF if requested
            if (attachPdf) {
                setGeneratingPdf(true);
                try {
                    const pdfBlob = await generateMemberStatementPDF({ statement });
                    const fileName = `statement-${selectedMember.id}-${Date.now()}.pdf`;
                    const filePath = `statements/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('reports')
                        .upload(filePath, pdfBlob, {
                            contentType: 'application/pdf',
                            upsert: true,
                        });

                    if (!uploadError) {
                        const { data: urlData } = supabase.storage
                            .from('reports')
                            .getPublicUrl(filePath);
                        pdfUrl = urlData.publicUrl;
                        pdfFilename = `Statement_${selectedMember.full_name.replace(/\s+/g, '_')}.pdf`;
                    }
                } catch (err) {
                    console.error('PDF generation error:', err);
                } finally {
                    setGeneratingPdf(false);
                }
            }

            await sendMessage({
                recipientType: 'MEMBER',
                recipientId,
                recipientPhone: phone,
                recipientName,
                messageType,
                message,
                attachPdf: !!pdfUrl,
                pdfUrl,
                pdfFilename,
            });
        } else if (messageType === 'GROUP_REPORT' && selectedGroup && reportData && leaders.length > 0) {
            // Send to all group leaders
            let successCount = 0;
            let failCount = 0;

            for (const leader of leaders) {
                const leaderMessage = generateGroupReportMessage(
                    selectedGroup.group_name,
                    leader.member_name,
                    reportType,
                    periodStart,
                    periodEnd,
                    reportData.summary.total_contributions,
                    reportData.group.active_members,
                    reportData.currency
                );

                const result = await sendMessage({
                    recipientType: 'LEADER',
                    recipientId: leader.member_id,
                    recipientPhone: leader.phone,
                    recipientName: leader.member_name,
                    messageType,
                    message: leaderMessage,
                });

                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            // Show summary (result will show last send)
            if (successCount > 0) {
                alert(`Sent report to ${successCount} leader(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
            }
        } else if (messageType === 'CUSTOM_MESSAGE' && selectedMember) {
            phone = selectedMember.phone;
            recipientId = selectedMember.id;
            recipientName = selectedMember.full_name;
            message = customMessage;

            await sendMessage({
                recipientType: 'MEMBER',
                recipientId,
                recipientPhone: phone,
                recipientName,
                messageType,
                message,
            });
        } else {
            alert('Please select a recipient and enter a message');
            return;
        }
    };

    // Reset form
    const handleReset = () => {
        setSelectedMember(null);
        setSelectedGroup(null);
        setSearchQuery('');
        setCustomMessage('');
        setPreviewMessage('');
        setShowPreview(false);
        reset();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">WhatsApp Messaging</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Send statements and reports to members via WhatsApp
                </p>
            </div>

            {/* Message Type Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Message Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => { setMessageType('MEMBER_STATEMENT'); handleReset(); }}
                        className={`p-4 rounded-lg border-2 transition-all ${messageType === 'MEMBER_STATEMENT'
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <FileText className={`mb-2 ${messageType === 'MEMBER_STATEMENT' ? 'text-green-600' : 'text-slate-400'}`} size={24} />
                        <div className="text-left">
                            <div className="font-semibold text-slate-900">Member Statement</div>
                            <div className="text-xs text-slate-500 mt-1">
                                Send savings balance, loans, arrears, and contribution history
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => { setMessageType('GROUP_REPORT'); handleReset(); }}
                        className={`p-4 rounded-lg border-2 transition-all ${messageType === 'GROUP_REPORT'
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <Users className={`mb-2 ${messageType === 'GROUP_REPORT' ? 'text-green-600' : 'text-slate-400'}`} size={24} />
                        <div className="text-left">
                            <div className="font-semibold text-slate-900">Group Report</div>
                            <div className="text-xs text-slate-500 mt-1">
                                Send periodic reports to group leaders
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => { setMessageType('CUSTOM_MESSAGE'); handleReset(); }}
                        className={`p-4 rounded-lg border-2 transition-all ${messageType === 'CUSTOM_MESSAGE'
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <MessageSquare className={`mb-2 ${messageType === 'CUSTOM_MESSAGE' ? 'text-green-600' : 'text-slate-400'}`} size={24} />
                        <div className="text-left">
                            <div className="font-semibold text-slate-900">Custom Message</div>
                            <div className="text-xs text-slate-500 mt-1">
                                Send a custom message to any member
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Member Search (for Member Statement and Custom Message) */}
            {(messageType === 'MEMBER_STATEMENT' || messageType === 'CUSTOM_MESSAGE') && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Member</h2>

                    {!selectedMember ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or phone number..."
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900"
                            />

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {searchResults.map((member) => (
                                        <button
                                            key={member.id}
                                            onClick={() => handleSelectMember(member)}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                        >
                                            <div className="font-medium text-slate-900">{member.full_name}</div>
                                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                                <Phone size={12} /> {member.phone}
                                                {member.group_name && (
                                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                                        {member.group_name}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 size={18} className="animate-spin text-slate-400" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div>
                                <div className="font-medium text-slate-900">{selectedMember.full_name}</div>
                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                    <Phone size={12} /> {selectedMember.phone}
                                    {selectedMember.group_name && (
                                        <span className="text-xs bg-white px-2 py-0.5 rounded">
                                            {selectedMember.group_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedMember(null); reset(); }}
                                className="p-2 hover:bg-green-100 rounded-full transition-colors"
                            >
                                <X size={18} className="text-slate-500" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Group Selection (for Group Report) */}
            {messageType === 'GROUP_REPORT' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Group</h2>
                    {loadingGroups ? (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Loading groups...</span>
                        </div>
                    ) : (
                        <select
                            value={selectedGroup?.id || ''}
                            onChange={(e) => {
                                const group = groups.find(g => g.id === e.target.value);
                                setSelectedGroup(group || null);
                            }}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900"
                        >
                            <option value="">Select a group...</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>{group.group_name}</option>
                            ))}
                        </select>
                    )}

                    {/* Report Period Selection */}
                    {selectedGroup && (
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value as 'WEEKLY' | 'MONTHLY' | 'OVERALL')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900"
                                >
                                    <option value="WEEKLY">Weekly Report</option>
                                    <option value="MONTHLY">Monthly Report</option>
                                    <option value="OVERALL">Overall Report</option>
                                </select>
                            </div>

                            {reportType !== 'OVERALL' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Period Start</label>
                                        <input
                                            type="date"
                                            value={periodStart}
                                            onChange={(e) => setPeriodStart(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Period End</label>
                                        <input
                                            type="date"
                                            value={periodEnd}
                                            onChange={(e) => setPeriodEnd(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Fetch Report Button */}
                            <div className="pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => fetchGroupReport(selectedGroup.id, reportType === 'OVERALL' ? 'CUSTOM' : reportType, periodStart, periodEnd)}
                                    disabled={loadingReport || !periodStart || !periodEnd}
                                    leftIcon={loadingReport ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                                >
                                    {loadingReport ? 'Loading...' : 'Fetch Report Data'}
                                </Button>
                            </div>

                            {/* Leaders Preview */}
                            {leaders.length > 0 && (
                                <div className="pt-4 border-t border-slate-200">
                                    <h3 className="text-sm font-medium text-slate-700 mb-2">Group Leaders ({leaders.length})</h3>
                                    <div className="space-y-2">
                                        {leaders.map((leader) => (
                                            <div key={leader.member_id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <Users size={16} className="text-slate-400" />
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{leader.member_name}</div>
                                                    <div className="text-xs text-slate-500">{leader.role} • {leader.phone}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Report Summary Preview */}
                            {reportData && (
                                <div className="pt-4 border-t border-slate-200">
                                    <h3 className="text-sm font-medium text-slate-700 mb-2">Report Summary</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <div className="text-xs text-green-600">Total Contributions</div>
                                            <div className="text-lg font-bold text-green-900">
                                                {reportData.currency} {reportData.summary.total_contributions.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="text-xs text-blue-600">Collection Rate</div>
                                            <div className="text-lg font-bold text-blue-900">
                                                {reportData.summary.collection_rate.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-lg">
                                            <div className="text-xs text-amber-600">Active Members</div>
                                            <div className="text-lg font-bold text-amber-900">
                                                {reportData.group.active_members}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-lg">
                                            <div className="text-xs text-red-600">Total Arrears</div>
                                            <div className="text-lg font-bold text-red-900">
                                                {reportData.currency} {reportData.summary.total_arrears.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Statement Preview (for Member Statement) */}
            {messageType === 'MEMBER_STATEMENT' && selectedMember && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Statement Preview</h2>
                    {loadingStatement ? (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Loading member statement...</span>
                        </div>
                    ) : statement ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="text-sm text-green-600">Savings Balance</div>
                                    <div className="text-xl font-bold text-green-900">
                                        {statement.currency} {statement.savings.current_balance.toLocaleString()}
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-sm text-blue-600">Total Contributions</div>
                                    <div className="text-xl font-bold text-blue-900">
                                        {statement.currency} {statement.savings.total_contributions.toLocaleString()}
                                    </div>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-lg">
                                    <div className="text-sm text-amber-600">Loan Balance</div>
                                    <div className="text-xl font-bold text-amber-900">
                                        {statement.currency} {statement.loans.active_loan_balance.toLocaleString()}
                                    </div>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <div className="text-sm text-red-600">Arrears</div>
                                    <div className="text-xl font-bold text-red-900">
                                        {statement.currency} {statement.savings.arrears.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            {statement.recent_transactions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-2">Recent Transactions</h3>
                                    <div className="text-sm text-slate-600 space-y-1">
                                        {statement.recent_transactions.slice(0, 3).map((tx) => (
                                            <div key={tx.id} className="flex justify-between">
                                                <span>{tx.type} - {new Date(tx.date).toLocaleDateString()}</span>
                                                <span className="font-medium">{statement.currency} {tx.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PDF Attachment Option */}
                            <div className="pt-4 border-t border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={attachPdf}
                                        onChange={(e) => setAttachPdf(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Paperclip size={16} className="text-slate-500" />
                                        <span className="text-sm font-medium text-slate-700">Attach PDF Statement</span>
                                    </div>
                                </label>
                                <p className="text-xs text-slate-500 mt-1 ml-8">
                                    Generate and attach a PDF document with the full statement
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Custom Message Input */}
            {messageType === 'CUSTOM_MESSAGE' && selectedMember && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Message Content</h2>
                    <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={6}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        {customMessage.length}/1000 characters
                    </p>
                </div>
            )}

            {/* Message Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">Message Preview</h3>
                            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[60vh]">
                            <div className="bg-green-50 rounded-lg p-4 whitespace-pre-wrap text-sm font-mono">
                                {previewMessage}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end">
                            <Button variant="secondary" onClick={() => setShowPreview(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result Message */}
            {result && (
                <div className={`p-4 rounded-lg border-2 ${result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-start gap-3">
                        {result.success ? (
                            <CheckCircle className="text-green-600 mt-0.5" size={20} />
                        ) : (
                            <AlertCircle className="text-red-600 mt-0.5" size={20} />
                        )}
                        <div className="flex-1">
                            <div className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'
                                }`}>
                                {result.success ? 'Message Sent!' : 'Failed to Send'}
                            </div>
                            <div className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'
                                }`}>
                                {result.success
                                    ? `Message delivered successfully${result.messageId ? ` (ID: ${result.messageId})` : ''}`
                                    : result.error}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="secondary"
                    onClick={generatePreview}
                    disabled={
                        (messageType === 'MEMBER_STATEMENT' && (!selectedMember || !statement)) ||
                        (messageType === 'GROUP_REPORT' && !selectedGroup) ||
                        (messageType === 'CUSTOM_MESSAGE' && (!selectedMember || !customMessage))
                    }
                    leftIcon={<Eye size={16} />}
                >
                    Preview Message
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSend}
                    disabled={
                        sending ||
                        (messageType === 'MEMBER_STATEMENT' && (!selectedMember || !statement)) ||
                        (messageType === 'GROUP_REPORT' && !selectedGroup) ||
                        (messageType === 'CUSTOM_MESSAGE' && (!selectedMember || !customMessage))
                    }
                    leftIcon={sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {sending ? 'Sending...' : 'Send via WhatsApp'}
                </Button>
            </div>
        </div>
    );
};
