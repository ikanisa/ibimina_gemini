/**
 * Group Contributions Tab Component
 * 
 * Displays contribution matrix and period detail views
 */

import React, { useState } from 'react';
import {
    LayoutGrid,
    List,
    ChevronLeft,
    ChevronRight,
    Smartphone,
    DollarSign,
    Wallet,
    Check
} from 'lucide-react';
import { Group, GroupMember, Contribution } from '../../types';

interface GroupContributionsTabProps {
    group: Group;
    groupMembers: GroupMember[];
    groupContributions: Contribution[];
    getPeriodLabel: (index: number, frequency: string) => string;
}

export const GroupContributionsTab: React.FC<GroupContributionsTabProps> = ({
    group,
    groupMembers,
    groupContributions,
    getPeriodLabel
}) => {
    const [contributionViewMode, setContributionViewMode] = useState<'Matrix' | 'Period'>('Matrix');
    const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number>(
        group.contributionFrequency === 'Monthly' ? 10 : 42
    );

    const currentPeriodLabel = getPeriodLabel(currentPeriodIndex, group.contributionFrequency);

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-800">Contributions</h3>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setContributionViewMode('Matrix')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${contributionViewMode === 'Matrix'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <LayoutGrid size={14} /> Cycle Matrix
                        </button>
                        <button
                            onClick={() => setContributionViewMode('Period')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${contributionViewMode === 'Period'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <List size={14} /> Period Detail
                        </button>
                    </div>
                </div>

                {contributionViewMode === 'Period' && (
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setCurrentPeriodIndex(prev => Math.max(1, prev - 1))}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold text-slate-700 w-24 text-center">
                            {currentPeriodLabel}
                        </span>
                        <button
                            onClick={() => setCurrentPeriodIndex(prev => prev + 1)}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {contributionViewMode === 'Matrix' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800">Contribution Matrix</h3>
                            <p className="text-xs text-slate-500">Cycle View: {group.cycleLabel}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                                <span className="w-3 h-3 bg-green-500 rounded-sm"></span> Paid
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                                <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Missed
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                                <span className="w-3 h-3 bg-slate-200 rounded-sm"></span> Future
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 text-left text-xs font-semibold text-slate-500 bg-slate-50 border-b border-r border-slate-200 sticky left-0 w-48">
                                        Member
                                    </th>
                                    {[40, 41, 42, 43, 44, 45].map(idx => {
                                        const label = getPeriodLabel(idx, group.contributionFrequency);
                                        return (
                                            <th
                                                key={idx}
                                                className="p-2 text-center text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200 min-w-[60px]"
                                            >
                                                {label}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {groupMembers.map((member) => (
                                    <tr key={member.memberId} className="hover:bg-slate-50">
                                        <td className="p-3 text-sm font-medium text-slate-900 border-r border-slate-100 bg-white sticky left-0">
                                            {member.name}
                                        </td>
                                        {[40, 41, 42, 43, 44, 45].map(week => {
                                            const isPast = week <= 42;
                                            const label = getPeriodLabel(week, group.contributionFrequency);
                                            const contribution = groupContributions.find(c =>
                                                c.memberId === member.memberId &&
                                                c.periodLabel === label &&
                                                c.groupId === group.id
                                            );

                                            let status = 'Future';
                                            if (isPast) status = contribution?.status || (Math.random() > 0.2 ? 'Paid' : 'Missed');

                                            return (
                                                <td key={week} className="p-2 text-center border border-slate-50">
                                                    {status === 'Future' ? (
                                                        <div className="w-8 h-8 mx-auto rounded bg-slate-100"></div>
                                                    ) : (
                                                        <div
                                                            className={`w-8 h-8 mx-auto rounded flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:opacity-80 ${status === 'Paid' ? 'bg-green-500' : 'bg-red-500'
                                                                }`}
                                                            title={`${label}: ${status}`}
                                                        >
                                                            {status === 'Paid' ? 'P' : 'M'}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-3">Member</div>
                        <div className="col-span-2 text-right">Expected</div>
                        <div className="col-span-2 text-right">Paid</div>
                        <div className="col-span-2 text-center">Channel</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-slate-100">
                        {groupMembers.map((member) => {
                            const contribution = groupContributions.find(c =>
                                c.memberId === member.memberId &&
                                c.periodLabel === currentPeriodLabel &&
                                c.groupId === group.id
                            );

                            const status = contribution?.status || 'Pending';
                            const isPaid = status === 'Paid';

                            return (
                                <div
                                    key={member.memberId}
                                    className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors"
                                >
                                    <div className="col-span-3">
                                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                        <p className="text-xs text-slate-500">{member.role}</p>
                                    </div>
                                    <div className="col-span-2 text-right text-sm text-slate-600">
                                        {group.contributionAmount.toLocaleString()} RWF
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-slate-400'}`}>
                                            {contribution?.paidAmount ? contribution.paidAmount.toLocaleString() : 0} RWF
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        {contribution?.channel ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-700">
                                                {contribution.channel === 'MoMo' && <Smartphone size={10} />}
                                                {contribution.channel === 'Cash' && <DollarSign size={10} />}
                                                {contribution.channel === 'Token' && <Wallet size={10} />}
                                                {contribution.channel}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 text-xs">-</span>
                                        )}
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border ${status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' :
                                                status === 'Missed' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {status === 'Paid' && <Check size={10} className="mr-1" />}
                                            {status}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right flex justify-end gap-2">
                                        {!isPaid && (
                                            <>
                                                <button
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded border border-green-200 bg-white transition-colors"
                                                    title="Mark Paid (Cash)"
                                                >
                                                    <DollarSign size={16} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 bg-white transition-colors"
                                                    title="Verify MoMo"
                                                >
                                                    <Smartphone size={16} />
                                                </button>
                                            </>
                                        )}
                                        {isPaid && (
                                            <button className="text-xs text-blue-600 hover:underline">Edit</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupContributionsTab;
