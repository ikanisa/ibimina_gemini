/**
 * Group Members Tab Component
 * 
 * Displays group member roster with performance metrics
 */

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { GroupMember, ViewState } from '../../types';

interface GroupMembersTabProps {
    groupMembers: GroupMember[];
    onNavigate?: (view: ViewState) => void;
}

export const GroupMembersTab: React.FC<GroupMembersTabProps> = ({
    groupMembers,
    onNavigate
}) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Group Roster</h3>
                <button
                    onClick={() => {
                        if (onNavigate) onNavigate(ViewState.MEMBERS);
                    }}
                    className="text-sm text-blue-600 font-medium hover:underline"
                >
                    Full Member Database
                </button>
            </div>
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Performance</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {groupMembers.map((member) => (
                        <tr key={member.memberId} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-900">{member.name}</p>
                                <p className="text-xs text-slate-500">{member.memberId}</p>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-xs px-2 py-1 rounded border ${member.role === 'Chairperson' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                        member.role === 'Treasurer' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                    {member.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{member.joinedDate}</td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="flex gap-1 text-xs mb-1">
                                        <span className="text-green-600 font-bold">{member.contributionsPaid}</span>
                                        <span className="text-slate-300">/</span>
                                        <span className="text-red-500 font-bold">{member.contributionsMissed}</span>
                                    </div>
                                    <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${member.contributionsMissed > 2 ? 'bg-orange-500' : 'bg-green-500'}`}
                                            style={{ width: `${(member.contributionsPaid / (member.contributionsPaid + member.contributionsMissed)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-slate-400 hover:text-blue-600">
                                    <MoreHorizontal size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GroupMembersTab;
