/**
 * MemberDetail Component
 * Detail drawer for member information with tabs
 */

import React, { useState } from 'react';
import { Member, ViewState } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { StatusIndicator } from '../ui/StatusIndicator';
import {
  X,
  User,
  CreditCard,
  History,
  ShieldCheck,
  FileText,
  Briefcase,
  Edit,
  Lock,
  Ban,
  CheckCircle,
} from 'lucide-react';

type Tab = 'Profile' | 'Accounts' | 'Transactions' | 'Documents' | 'Tokens';

interface MemberDetailProps {
  member: Member;
  onClose: () => void;
  onNavigate?: (view: ViewState) => void;
}

export const MemberDetail: React.FC<MemberDetailProps> = ({
  member,
  onClose,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('Profile');

  const tabs = [
    { id: 'Profile' as Tab, label: 'Profile', icon: User },
    { id: 'Accounts' as Tab, label: 'Accounts', icon: CreditCard },
    { id: 'Transactions' as Tab, label: 'Transactions', icon: History },
    { id: 'Tokens' as Tab, label: 'Tokens', icon: ShieldCheck },
    { id: 'Documents' as Tab, label: 'Documents', icon: FileText },
  ];

  return (
    <div className="w-full lg:w-1/2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
        <div className="flex items-center gap-3">
          <img
            src={member.avatarUrl}
            alt=""
            className="w-14 h-14 rounded-full border-2 border-white object-cover"
          />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{member.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                {member.id}
              </span>
              {member.kycStatus === 'Verified' && (
                <StatusIndicator status="active" label="KYC Verified" size="sm" showIcon={false} />
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
        {activeTab === 'Profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-600" /> Group Memberships (Ibimina)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {member.groups.length > 0 ? (
                  <div className="space-y-2">
                    {member.groups.map((group, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100"
                      >
                        <span className="text-sm font-medium text-slate-700">{group}</span>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate(ViewState.GROUPS)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Group
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    Not a member of any active group.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent>
                  <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-slate-900">{member.phone}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs text-slate-500 mb-1">Home Branch</p>
                  <p className="text-sm font-medium text-slate-900">{member.branch}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm text-left hover:bg-slate-50 transition-colors text-slate-700 flex items-center gap-3">
                    <Edit size={16} /> Edit Info
                  </button>

                  {member.kycStatus !== 'Verified' && (
                    <button className="w-full bg-white border border-green-200 p-3 rounded-lg text-sm text-left hover:bg-green-50 transition-colors text-green-700 flex items-center gap-3">
                      <CheckCircle size={16} /> Mark as Verified
                    </button>
                  )}

                  <button className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm text-left hover:bg-slate-50 transition-colors text-slate-700 flex items-center gap-3">
                    <Lock size={16} /> Reset PIN / Password
                  </button>

                  <button className="w-full bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-left hover:bg-red-100 transition-colors text-red-600 flex items-center gap-3">
                    <Ban size={16} /> Suspend Member
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'Accounts' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Main Savings</CardTitle>
                  <StatusIndicator status="active" label="Active" size="sm" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {member.savingsBalance.toLocaleString()}{' '}
                  <span className="text-sm font-normal text-slate-500">RWF</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">Last deposit: 2 days ago</p>
              </CardContent>
            </Card>

            <Card className="hover:border-blue-300 transition-colors cursor-pointer" onClick={() => onNavigate && onNavigate(ViewState.LOANS)}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Loan Account</CardTitle>
                  <StatusIndicator
                    status={member.loanBalance > 0 ? 'pending' : 'inactive'}
                    label={member.loanBalance > 0 ? 'Active Loan' : 'No Active Loan'}
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {member.loanBalance.toLocaleString()}{' '}
                  <span className="text-sm font-normal text-slate-500">RWF</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">Next repayment due: 25 Oct 2023</p>
              </CardContent>
            </Card>
          </div>
        )}

        {(activeTab === 'Transactions' || activeTab === 'Documents' || activeTab === 'Tokens') && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm">No recent items found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
