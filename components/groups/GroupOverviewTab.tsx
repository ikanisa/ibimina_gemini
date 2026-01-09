/**
 * GroupOverviewTab Component
 * Overview tab showing group summary and recent activity
 */

import React from 'react';
import { Group, GroupMember, Meeting } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Calendar, DollarSign, Users, AlertCircle } from 'lucide-react';
import { ViewState } from '../../types';

interface GroupOverviewTabProps {
  group: Group;
  members?: GroupMember[];
  meetings?: Meeting[];
  onNavigate?: (view: ViewState) => void;
}

export const GroupOverviewTab: React.FC<GroupOverviewTabProps> = ({
  group,
  members = [],
  meetings = [],
  onNavigate,
}) => {
  const recentMeetings = meetings.filter((m) => m.groupId === group.id).slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Overview Card */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contribution Cycle Progress</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Recent Meetings */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Meetings</CardTitle>
              <button
                onClick={() => {
                  // Navigate to meetings tab
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {recentMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="px-6 py-4 flex justify-between items-center hover:bg-slate-50"
                >
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
                      <p className="text-xs text-slate-500">
                        {meeting.attendanceCount} Members attended
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      +{meeting.totalCollected.toLocaleString()} RWF
                    </p>
                    <p className="text-xs text-slate-400">{meeting.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Quick Actions & Alerts */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                <Calendar size={18} /> Start New Meeting
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                <DollarSign size={18} /> Disburse Group Loan
              </button>
              {onNavigate && (
                <button
                  onClick={() => onNavigate(ViewState.MEMBERS)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  <Users size={18} /> Add Member
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertCircle size={16} /> Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs text-amber-900">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                Member has missed 3 consecutive contributions.
              </li>
              <li className="flex items-start gap-2 text-xs text-amber-900">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                Loan Repayment is 2 days overdue.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
