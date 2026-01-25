/**
 * Group MoMo Tab Component
 * 
 * Displays Mobile Money transactions and SMS logs for a group
 */

import React from 'react';
import { Smartphone } from 'lucide-react';
import { Group, SmsMessage, Transaction } from '../../types';

interface GroupMoMoTabProps {
    group: Group;
    groupSms: SmsMessage[];
    groupTransactions: Transaction[];
}

export const GroupMoMoTab: React.FC<GroupMoMoTabProps> = ({
    group,
    groupSms,
    groupTransactions
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                    <Smartphone size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 text-sm">Group Mobile Money Hub</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Showing MoMo transactions and SMS logs likely related to <strong>{group.name}</strong>.
                        AI matches based on member phone numbers and contribution amounts.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h4 className="font-bold text-slate-700 text-sm">Unlinked SMS (Suggestions)</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {groupSms.filter(sms => !sms.linkedTransactionId).map(sms => (
                            <div key={sms.id} className="p-4 hover:bg-slate-50">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-sm text-slate-900">{sms.sender}</span>
                                    <span className="text-xs text-slate-400">{sms.timestamp.split(' ')[1]}</span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 mb-2">{sms.body}</p>
                                {sms.parsedData && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-mono bg-slate-100 px-1.5 rounded text-slate-600">
                                            {sms.parsedData.amount.toLocaleString()} {sms.parsedData.currency}
                                        </span>
                                        <button className="text-xs text-blue-600 font-medium hover:underline">
                                            Link to Member
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {groupSms.filter(sms => !sms.linkedTransactionId).length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">No unmatched SMS found.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h4 className="font-bold text-slate-700 text-sm">Confirmed Transactions</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {groupTransactions.filter(tx => tx.groupId === group.id).map(tx => (
                            <div key={tx.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{tx.memberName}</p>
                                    <p className="text-xs text-slate-500">{tx.channel} • {tx.reference}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-600">+{tx.amount.toLocaleString()} RWF</p>
                                    <span className="text-[10px] text-slate-400">{tx.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupMoMoTab;
