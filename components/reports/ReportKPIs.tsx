/**
 * ReportKPIs Component
 * Displays KPI cards based on report scope
 */

import React from 'react';
import { Wallet, UserCheck, AlertCircle, Briefcase, Users, Calendar, TrendingUp, FileText } from 'lucide-react';
import { ReportKpiCard } from './ReportKpiCard';
import { ReportScope } from './types';

interface ReportKPIsProps {
  scope: ReportScope;
  kpis: Record<string, number | string | null>;
}

export const ReportKPIs: React.FC<ReportKPIsProps> = ({ scope, kpis }) => {
  if (scope === 'member') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportKpiCard
          label="Total Contributed"
          value={`${(Number(kpis.total_contributed) || 0).toLocaleString()} RWF`}
          icon={<Wallet size={20} />}
          variant="success"
        />
        <ReportKpiCard
          label="Transactions"
          value={Number(kpis.transaction_count) || 0}
          icon={<FileText size={20} />}
        />
        <ReportKpiCard
          label="Last Payment"
          value={
            kpis.last_payment_date
              ? new Date(kpis.last_payment_date as string).toLocaleDateString()
              : '—'
          }
          icon={<Calendar size={20} />}
        />
        <ReportKpiCard
          label="Avg Amount"
          value={`${Math.round(Number(kpis.avg_amount) || 0).toLocaleString()} RWF`}
          icon={<TrendingUp size={20} />}
        />
      </div>
    );
  }

  if (scope === 'group') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportKpiCard
          label="Total Received"
          value={`${(Number(kpis.total_received) || 0).toLocaleString()} RWF`}
          icon={<Wallet size={20} />}
          variant="success"
        />
        <ReportKpiCard
          label="Allocated Total"
          value={`${(Number(kpis.allocated_total) || 0).toLocaleString()} RWF`}
          icon={<UserCheck size={20} />}
        />
        <ReportKpiCard
          label="Unallocated"
          value={Number(kpis.unallocated_count) || 0}
          icon={<AlertCircle size={20} />}
          variant={Number(kpis.unallocated_count) > 0 ? 'warning' : 'default'}
        />
        <ReportKpiCard
          label="Members"
          value={Number(kpis.member_count) || 0}
          icon={<Users size={20} />}
        />
      </div>
    );
  }

  // Institution scope
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <ReportKpiCard
        label="Total Received"
        value={`${(Number(kpis.total_received) || 0).toLocaleString()} RWF`}
        icon={<Wallet size={20} />}
        variant="success"
      />
      <ReportKpiCard
        label="Allocated"
        value={`${(Number(kpis.allocated_total) || 0).toLocaleString()} RWF`}
        icon={<UserCheck size={20} />}
      />
      <ReportKpiCard
        label="Unallocated"
        value={`${(Number(kpis.unallocated_total) || 0).toLocaleString()} RWF`}
        subValue={`${Number(kpis.unallocated_count) || 0} txns`}
        icon={<AlertCircle size={20} />}
        variant={Number(kpis.unallocated_count) > 0 ? 'warning' : 'default'}
      />
      <ReportKpiCard
        label="Parse Errors"
        value={Number(kpis.parse_errors_count) || 0}
        icon={<AlertCircle size={20} />}
        variant={Number(kpis.parse_errors_count) > 0 ? 'danger' : 'default'}
      />
      <ReportKpiCard
        label="Active Groups"
        value={Number(kpis.active_groups_count) || 0}
        icon={<Briefcase size={20} />}
      />
      <ReportKpiCard
        label="Active Members"
        value={Number(kpis.active_members_count) || 0}
        icon={<Users size={20} />}
      />
    </div>
  );
};
