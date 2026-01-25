/**
 * Page-Specific Skeleton Components
 * Skeleton screens for major pages to improve perceived performance
 */

import React from 'react';
import { Skeleton, TableRowSkeleton, CardSkeleton, StatsCardSkeleton } from './Skeleton';

/**
 * Dashboard Page Skeleton
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Recent Transactions */}
      <CardSkeleton />
    </div>
  );
};

/**
 * Transactions Page Skeleton
 */
export const TransactionsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="200px" height={24} />
          <div className="flex gap-2">
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="rounded" width={100} height={36} />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={100} height={32} />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton variant="text" width="80px" height={16} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRowSkeleton key={i} columns={6} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Members Page Skeleton
 */
export const MembersSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="150px" height={24} />
          <Skeleton variant="rounded" width={120} height={36} />
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="40%" height={16} />
              <Skeleton variant="text" width="60%" height={14} />
            </div>
            <Skeleton variant="rounded" width={80} height={32} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Groups Page Skeleton
 */
export const GroupsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="150px" height={24} />
          <Skeleton variant="rounded" width={120} height={36} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton variant="text" width="80px" height={16} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRowSkeleton key={i} columns={7} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Reports Page Skeleton
 */
export const ReportsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Filters */}
      <CardSkeleton />

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <Skeleton variant="text" width="200px" height={24} className="mb-4" />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>

      {/* Table */}
      <CardSkeleton />
    </div>
  );
};
