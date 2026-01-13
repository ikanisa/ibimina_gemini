import React, { useState, useEffect } from 'react';
import { Bell, Send, FileText, Users, AlertCircle, CheckCircle, Loader2, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../ui';
import { generateGroupReport, getGroupLeaders } from '../../../lib/api/reports.api';
import { notificationService } from '../../../lib/services/notification.service';

interface Group {
  id: string;
  group_name: string;
  frequency: string;
  daily_contribution: boolean;
  expected_amount: number;
  currency: string;
}

interface NotificationResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
}

export const NotificationsSettings: React.FC = () => {
  const { institutionId } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<NotificationResult | null>(null);
  const [notificationType, setNotificationType] = useState<'report' | 'reminder' | 'periodic'>('report');
  const [reportType, setReportType] = useState<'WEEKLY' | 'MONTHLY' | 'OVERALL'>('WEEKLY');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');

  useEffect(() => {
    loadGroups();
    setDefaultDates();
  }, [institutionId, reportType]);

  const setDefaultDates = () => {
    const now = new Date();
    if (reportType === 'WEEKLY') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      setPeriodStart(weekStart.toISOString().split('T')[0]);
      setPeriodEnd(now.toISOString().split('T')[0]);
    } else if (reportType === 'MONTHLY') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setPeriodStart(monthStart.toISOString().split('T')[0]);
      setPeriodEnd(now.toISOString().split('T')[0]);
    } else {
      setPeriodStart('');
      setPeriodEnd('');
    }
  };

  const loadGroups = async () => {
    if (!institutionId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('id, group_name, frequency, daily_contribution, expected_amount, currency')
      .eq('institution_id', institutionId)
      .eq('status', 'ACTIVE')
      .order('group_name');

    if (error) {
      console.error('Error loading groups:', error);
    } else if (data) {
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    }
    setLoading(false);
  };

  const handleSendReport = async () => {
    if (!selectedGroupId) {
      setResult({ success: false, error: 'Please select a group' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const report = await generateGroupReport({
        groupId: selectedGroupId,
        reportType,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        sendToLeaders: true,
      });

      setResult({
        success: true,
        message: `Report generated and sent to group leaders successfully`,
        details: report,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate and send report',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendReminders = async () => {
    if (!selectedGroupId) {
      setResult({ success: false, error: 'Please select a group' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Get group members
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('member:members(id, full_name, phone)')
        .eq('group_id', selectedGroupId)
        .eq('status', 'GOOD_STANDING');

      if (membersError) throw membersError;

      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      if (!selectedGroup) throw new Error('Group not found');

      // Calculate due date (7 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // Send reminders to each member
      for (const gm of groupMembers || []) {
        const member = Array.isArray(gm.member) ? gm.member[0] : gm.member;
        if (!member || !member.phone) continue;

        try {
          const result = await notificationService.sendContributionReminder(
            institutionId!,
            member.id,
            member.full_name || 'Member',
            member.phone,
            selectedGroup.group_name,
            selectedGroup.expected_amount,
            selectedGroup.currency,
            dueDate.toISOString().split('T')[0],
            'BOTH'
          );

          if (result.success) {
            successCount++;
          } else {
            failCount++;
            errors.push(`${member.full_name}: ${result.error}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`${member.full_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setResult({
        success: successCount > 0,
        message: `Sent reminders to ${successCount} members${failCount > 0 ? `, ${failCount} failed` : ''}`,
        details: { successCount, failCount, errors: errors.slice(0, 5) },
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reminders',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendPeriodicTotals = async () => {
    if (!selectedGroupId) {
      setResult({ success: false, error: 'Please select a group' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Get group members
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('member:members(id, full_name, phone)')
        .eq('group_id', selectedGroupId)
        .eq('status', 'GOOD_STANDING');

      if (membersError) throw membersError;

      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      if (!selectedGroup) throw new Error('Group not found');

      // Determine period label
      let periodLabel = '';
      if (selectedGroup.daily_contribution) {
        periodLabel = `Week of ${new Date(periodStart).toLocaleDateString()}`;
      } else if (selectedGroup.frequency === 'Weekly') {
        periodLabel = `Week of ${new Date(periodStart).toLocaleDateString()}`;
      } else {
        periodLabel = new Date(periodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // Send periodic totals to each member
      for (const gm of groupMembers || []) {
        const member = Array.isArray(gm.member) ? gm.member[0] : gm.member;
        if (!member || !member.phone) continue;

        try {
          // Get member contributions summary
          const { data: summary } = await supabase.rpc('get_member_contributions_summary', {
            p_member_id: member.id,
            p_group_id: selectedGroupId,
            p_period_start: periodStart || null,
            p_period_end: periodEnd || null,
          });

          if (summary) {
            const result = await notificationService.sendPeriodicTotal(
              institutionId!,
              member.id,
              member.full_name || 'Member',
              member.phone,
              selectedGroup.group_name,
              periodLabel,
              parseFloat(summary.period_total || 0),
              parseFloat(summary.overall_total || 0),
              selectedGroup.currency,
              'BOTH'
            );

            if (result.success) {
              successCount++;
            } else {
              failCount++;
              errors.push(`${member.full_name}: ${result.error}`);
            }
          }
        } catch (error) {
          failCount++;
          errors.push(`${member.full_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setResult({
        success: successCount > 0,
        message: `Sent periodic totals to ${successCount} members${failCount > 0 ? `, ${failCount} failed` : ''}`,
        details: { successCount, failCount, errors: errors.slice(0, 5) },
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send periodic totals',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    switch (notificationType) {
      case 'report':
        handleSendReport();
        break;
      case 'reminder':
        handleSendReminders();
        break;
      case 'periodic':
        handleSendPeriodicTotals();
        break;
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications & Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Manually trigger reports and notifications to members and leaders</p>
      </div>

      {/* Notification Type Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Notification Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setNotificationType('report')}
            className={`p-4 rounded-lg border-2 transition-all ${
              notificationType === 'report'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <FileText className={`mb-2 ${notificationType === 'report' ? 'text-blue-600' : 'text-slate-400'}`} size={24} />
            <div className="text-left">
              <div className="font-semibold text-slate-900">Group Report</div>
              <div className="text-xs text-slate-500 mt-1">Send PDF report to group leaders</div>
            </div>
          </button>

          <button
            onClick={() => setNotificationType('reminder')}
            className={`p-4 rounded-lg border-2 transition-all ${
              notificationType === 'reminder'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Bell className={`mb-2 ${notificationType === 'reminder' ? 'text-blue-600' : 'text-slate-400'}`} size={24} />
            <div className="text-left">
              <div className="font-semibold text-slate-900">Contribution Reminders</div>
              <div className="text-xs text-slate-500 mt-1">Send reminders to all members</div>
            </div>
          </button>

          <button
            onClick={() => setNotificationType('periodic')}
            className={`p-4 rounded-lg border-2 transition-all ${
              notificationType === 'periodic'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <MessageSquare className={`mb-2 ${notificationType === 'periodic' ? 'text-blue-600' : 'text-slate-400'}`} size={24} />
            <div className="text-left">
              <div className="font-semibold text-slate-900">Periodic Totals</div>
              <div className="text-xs text-slate-500 mt-1">Send contribution summaries to members</div>
            </div>
          </button>
        </div>
      </div>

      {/* Group Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Group</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading groups...</span>
          </div>
        ) : (
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a group...</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.group_name} ({group.frequency} - {group.expected_amount} {group.currency})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Report Type Selection (for reports) */}
      {notificationType === 'report' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Options</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as 'WEEKLY' | 'MONTHLY' | 'OVERALL');
                  setDefaultDates();
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="WEEKLY">Weekly Report</option>
                <option value="MONTHLY">Monthly Report</option>
                <option value="OVERALL">Overall Report</option>
              </select>
            </div>

            {reportType !== 'OVERALL' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Period Selection (for periodic totals) */}
      {notificationType === 'periodic' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Period Selection</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-lg border-2 ${
          result.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <div className={`font-semibold ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? 'Success' : 'Error'}
              </div>
              <div className={`text-sm mt-1 ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message || result.error}
              </div>
              {result.details && (
                <details className="mt-2 text-xs text-slate-600">
                  <summary className="cursor-pointer">View details</summary>
                  <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!selectedGroupId || sending}
          leftIcon={sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        >
          {sending ? 'Sending...' : 'Send Notification'}
        </Button>
      </div>
    </div>
  );
};
