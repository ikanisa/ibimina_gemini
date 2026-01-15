/**
 * GroupDetail Component
 * Container for group detail view with tabs
 */

import React, { useState } from 'react';
import { Group, ViewState } from '@/core/types';
import { Briefcase, Users, DollarSign, CheckCircle2, Calendar, Smartphone, Settings } from 'lucide-react';
import { GroupOverviewTab } from './GroupOverviewTab';
import { GroupMembersTab } from './GroupMembersTab';
import { GroupContributionsTab } from './GroupContributionsTab';
import { GroupMeetingsTab } from './GroupMeetingsTab';
import { GroupSettingsTab } from './GroupSettingsTab';
import { Breadcrumbs } from '@/shared/components/ui/Breadcrumbs';
import type { DetailTab } from './types';

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
  onNavigate?: (view: ViewState) => void;
  // Data props
  members?: any[];
  meetings?: any[];
  contributions?: any[];
  transactions?: any[];
  sms?: any[];
  loading?: boolean;
  error?: string | null;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({
  group,
  onBack,
  onNavigate,
  members = [],
  meetings = [],
  contributions = [],
  transactions = [],
  sms = [],
  loading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');

  const tabs = [
    { id: 'Overview' as DetailTab, label: 'Overview', icon: Briefcase },
    { id: 'Members' as DetailTab, label: 'Members', icon: Users },
    { id: 'Contributions' as DetailTab, label: 'Contributions', icon: DollarSign },
    { id: 'Loans' as DetailTab, label: 'Loans', icon: CheckCircle2 },
    { id: 'Meetings' as DetailTab, label: 'Meetings', icon: Calendar },
    { id: 'MoMo' as DetailTab, label: 'MoMo', icon: Smartphone },
    { id: 'Settings' as DetailTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-white">
        <Breadcrumbs
          items={[
            { label: 'Groups', onClick: onBack },
            { label: group.name },
          ]}
          className="mb-4"
        />

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
              {group.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-600">
                  {group.code}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} /> {group.memberCount} Members
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {group.meetingDay}s
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Group Fund Balance
            </p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {group.fundBalance.toLocaleString()}{' '}
              <span className="text-lg text-slate-400 font-normal">RWF</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-8 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {activeTab === 'Overview' && (
          <GroupOverviewTab
            group={group}
            members={members}
            meetings={meetings}
            onNavigate={onNavigate}
          />
        )}
        {activeTab === 'Members' && (
          <GroupMembersTab group={group} members={members} onNavigate={onNavigate} />
        )}
        {activeTab === 'Contributions' && (
          <GroupContributionsTab
            group={group}
            contributions={contributions}
            members={members}
          />
        )}
        {activeTab === 'Meetings' && (
          <GroupMeetingsTab group={group} meetings={meetings} />
        )}
        {activeTab === 'Settings' && (
          <GroupSettingsTab group={group} />
        )}
        {activeTab === 'Loans' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Group-Backed Loans</h3>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
              <p>Loans feature coming soon</p>
            </div>
          </div>
        )}
        {activeTab === 'MoMo' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-900 text-sm">Group Mobile Money Hub</h4>
              <p className="text-xs text-blue-700 mt-1">
                MoMo transactions and SMS logs for this group.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
              <p>MoMo feature coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
