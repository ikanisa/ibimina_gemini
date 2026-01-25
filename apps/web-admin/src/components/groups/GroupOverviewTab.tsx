/**
 * GroupOverviewTab Component
 * Overview tab showing group summary and recent activity
 */

import React from 'react';
import { Group, GroupMember } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DollarSign, Users, AlertCircle, PiggyBank } from 'lucide-react';
import { ViewState } from '../../types';

interface GroupOverviewTabProps {
  group: Group;
  members?: GroupMember[];
  onNavigate?: (view: ViewState) => void;
}

export const GroupOverviewTab: React.FC<GroupOverviewTabProps> = ({
  group,
  members = [],
  onNavigate,
}) => {
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
                <p className="text-xs text-slate-500 uppercase">Expected / Period</p>
                <p className="text-lg font-bold text-slate-900">
                  {(group.contributionAmount * group.memberCount).toLocaleString()} RWF
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Arrears Total</p>
                <p className="text-lg font-bold text-red-600">45,000 RWF</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Next Collection</p>
                <p className="text-lg font-bold text-slate-900">{group.nextMeeting}</p>
              </div>
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
                <PiggyBank size={18} /> Record Contribution
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
