/**
 * GroupMeetingsTab Component
 * Displays group meetings list
 */

import React from 'react';
import { Group, Meeting } from '@/core/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Calendar, Users, DollarSign } from 'lucide-react';
import { StatusIndicator } from '@/shared/components/ui/StatusIndicator';

interface GroupMeetingsTabProps {
  group: Group;
  meetings?: Meeting[];
}

export const GroupMeetingsTab: React.FC<GroupMeetingsTabProps> = ({
  group,
  meetings = [],
}) => {
  const groupMeetings = meetings.filter((m) => m.groupId === group.id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Meeting Log</h3>
        <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
          <Calendar size={16} /> Schedule Meeting
        </button>
      </div>

      <div className="grid gap-4">
        {groupMeetings.map((meeting) => (
          <Card key={meeting.id} hover>
            <CardContent padding="lg">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div
                    className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${
                      meeting.status === 'Completed'
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">
                      {meeting.date.split('-')[1]}
                    </span>
                    <span className="text-xl font-bold">{meeting.date.split('-')[2]}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{meeting.type} Meeting</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {meeting.notes || 'No notes recorded.'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {meeting.attendanceCount} Attended
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} /> {meeting.totalCollected.toLocaleString()} RWF
                        Collected
                      </span>
                    </div>
                  </div>
                </div>
                <StatusIndicator
                  status={meeting.status === 'Completed' ? 'active' : 'pending'}
                  label={meeting.status}
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groupMeetings.length === 0 && (
        <Card>
          <CardContent>
            <div className="p-12 text-center text-slate-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p>No meetings recorded</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
