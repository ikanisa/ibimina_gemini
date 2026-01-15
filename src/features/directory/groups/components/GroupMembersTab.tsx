/**
 * GroupMembersTab Component
 * Displays group members list
 */

import React from 'react';
import { Group, GroupMember } from '../../types';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { MoreHorizontal, Users } from 'lucide-react';
import { ViewState } from '../../types';

interface GroupMembersTabProps {
  group: Group;
  members?: GroupMember[];
  onNavigate?: (view: ViewState) => void;
}

export const GroupMembersTab: React.FC<GroupMembersTabProps> = ({
  group,
  members = [],
  onNavigate,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Group Roster</CardTitle>
          {onNavigate && (
            <button
              onClick={() => onNavigate(ViewState.MEMBERS)}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              Full Member Database
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-center">Performance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {members.map((member) => (
              <TableRow key={member.memberId} hover>
                <TableCell>
                  <p className="text-sm font-bold text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.memberId}</p>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded border ${
                      member.role === 'Chairperson'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : member.role === 'Treasurer'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}
                  >
                    {member.role}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{member.joinedDate}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex gap-1 text-xs mb-1">
                      <span className="text-green-600 font-bold">{member.contributionsPaid}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-red-500 font-bold">{member.contributionsMissed}</span>
                    </div>
                    <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          member.contributionsMissed > 2 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${
                            (member.contributionsPaid /
                              (member.contributionsPaid + member.contributionsMissed)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <button className="text-slate-400 hover:text-blue-600">
                    <MoreHorizontal size={18} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {members.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p>No members in this group</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
