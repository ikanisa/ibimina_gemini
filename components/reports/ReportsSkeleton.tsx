/**
 * Reports Skeleton Loader
 * Loading state for the reports page
 */

import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const ReportsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header with scope selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Skeleton variant="text" width="200px" height={28} />
                    <Skeleton variant="text" width="150px" height={16} className="mt-2" />
                </div>
                <div className="flex gap-3">
                    <Skeleton variant="rounded" width={150} height={40} />
                    <Skeleton variant="rounded" width={200} height={40} />
                    <Skeleton variant="rounded" width={120} height={40} />
                </div>
            </div>

            {/* Date range selector */}
            <div className="flex gap-4 items-center">
                <Skeleton variant="rounded" width={140} height={36} />
                <Skeleton variant="text" width={20} height={16} />
                <Skeleton variant="rounded" width={140} height={36} />
                <Skeleton variant="rounded" width={100} height={36} />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <Skeleton variant="text" width="70%" height={14} />
                        <Skeleton variant="text" width="50%" height={28} className="mt-2" />
                        <Skeleton variant="text" width="40%" height={12} className="mt-1" />
                    </div>
                ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1 */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <Skeleton variant="text" width="40%" height={20} className="mb-4" />
                    <div className="flex items-end justify-between gap-2" style={{ height: 200 }}>
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="rectangular"
                                width="12%"
                                height={`${Math.random() * 60 + 40}%`}
                            />
                        ))}
                    </div>
                </div>

                {/* Chart 2 - Pie chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <Skeleton variant="text" width="40%" height={20} className="mb-4" />
                    <div className="flex items-center justify-center" style={{ height: 200 }}>
                        <Skeleton variant="circular" width={160} height={160} />
                    </div>
                </div>
            </div>

            {/* Data table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <Skeleton variant="text" width="30%" height={20} />
                </div>
                <div className="px-6 py-4 border-b border-slate-100 flex gap-4 bg-slate-50">
                    <Skeleton variant="text" width="25%" height={14} />
                    <Skeleton variant="text" width="15%" height={14} />
                    <Skeleton variant="text" width="15%" height={14} />
                    <Skeleton variant="text" width="15%" height={14} />
                    <Skeleton variant="text" width="15%" height={14} />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-6 py-3 border-b border-slate-100 flex gap-4">
                        <Skeleton variant="text" width="25%" height={16} />
                        <Skeleton variant="text" width="15%" height={16} />
                        <Skeleton variant="text" width="15%" height={16} />
                        <Skeleton variant="text" width="15%" height={16} />
                        <Skeleton variant="text" width="15%" height={16} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportsSkeleton;
