/**
 * Group Overview Tab Component
 * 
 * Displays group overview including cycle progress, quick actions, and alerts
 */

import React from 'react';
import {
    Calendar,
    DollarSign,
    Users,
    AlertCircle,
    Briefcase
} from 'lucide-react';
import { Group, GroupMember, Meeting, ViewState } from '../../types';

interface GroupOverviewTabProps {
    group: Group;
    groupMembers: GroupMember[];
    groupMeetings: Meeting[];
    onNavigate?: (view: ViewState) => void;
    onTabChange: (tab: string) => void;
}

export const GroupOverviewTab: React.FC<GroupOverviewTabProps> = ({
    group,
    groupMembers,
    groupMeetings,
    onNavigate,
    onTabChange
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Main Overview Card */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Contribution Cycle Progress</h3>
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600 font-medium">{group.cycleLabel}</span>
                            <span className="text-blue-600 font-bold">84% Completed</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full w-[84%]"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Expected / Meeting</p>
                            <p className="text-lg font-bold text-slate-900">
                                {(group.contributionAmount * group.memberCount).toLocaleString()} RWF
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Arrears Total</p>
                            <p className="text-lg font-bold text-red-600">45,000 RWF</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Next Meeting</p>
                            <p className="text-lg font-bold text-slate-900">{group.nextMeeting}</p>
                        </div>
                    </div>
                </div>

                {/* Recent Meetings List Preview */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Recent Meetings</h3>
                        <button
                            onClick={() => onTabChange('Meetings')}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {groupMeetings.filter(m => m.groupId === group.id).slice(0, 3).map(meeting => (
                            <div key={meeting.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 text-center bg-slate-100 rounded-lg py-1">
                                        <span className="block text-xs text-slate-500 font-bold uppercase">
                                            {meeting.date.split('-')[1]}
                                        </span>
                                        <span className="block text-lg font-bold text-slate-900">
                                            {meeting.date.split('-')[2]}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{meeting.type} Meeting</p>
                                        <p className="text-xs text-slate-500">{meeting.attendanceCount} Members attended</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-600">+{meeting.totalCollected.toLocaleString()} RWF</p>
                                    <p className="text-xs text-slate-400">{meeting.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Alerts & Quick Actions */}
            <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                            <Calendar size={18} /> Start New Meeting
                        </button>
                        <button
                            onClick={() => onTabChange('Loans')}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                        >
                            <DollarSign size={18} /> Disburse Group Loan
                        </button>
                        <button
                            onClick={() => {
                                if (onNavigate) onNavigate(ViewState.MEMBERS);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                        >
                            <Users size={18} /> Add Member
                        </button>
                    </div>
                </div>

                <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                    <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                        <AlertCircle size={16} /> Attention Needed
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-xs text-amber-900">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                            Member Divine Keza has missed 3 consecutive contributions.
                        </li>
                        <li className="flex items-start gap-2 text-xs text-amber-900">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                            Loan Repayment for Grace U. is 2 days overdue.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default GroupOverviewTab;
