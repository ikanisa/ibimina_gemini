/**
 * Group Meetings Tab Component
 * 
 * Displays meeting log and schedule for a group
 */

import React from 'react';
import { Calendar, Users, DollarSign } from 'lucide-react';
import { Group, Meeting } from '../../types';

interface GroupMeetingsTabProps {
    group: Group;
    groupMeetings: Meeting[];
}

export const GroupMeetingsTab: React.FC<GroupMeetingsTabProps> = ({
    group,
    groupMeetings
}) => {
    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Meeting Log</h3>
                <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                    <Calendar size={16} /> Schedule Meeting
                </button>
            </div>

            <div className="grid gap-4">
                {groupMeetings.filter(m => m.groupId === group.id).map(meeting => (
                    <div
                        key={meeting.id}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${meeting.status === 'Completed'
                                        ? 'bg-slate-50 border-slate-200'
                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                    }`}>
                                    <span className="text-xs font-bold uppercase">{meeting.date.split('-')[1]}</span>
                                    <span className="text-xl font-bold">{meeting.date.split('-')[2]}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{meeting.type} Meeting</h4>
                                    <p className="text-sm text-slate-500 mt-1">{meeting.notes || 'No notes recorded.'}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Users size={12} /> {meeting.attendanceCount} Attended
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <DollarSign size={12} /> {meeting.totalCollected.toLocaleString()} RWF Collected
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${meeting.status === 'Completed'
                                    ? 'bg-green-50 text-green-700 border-green-100'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                {meeting.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupMeetingsTab;
