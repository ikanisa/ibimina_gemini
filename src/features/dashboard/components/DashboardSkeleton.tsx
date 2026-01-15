/**
 * Dashboard Skeleton Loader
 * Loading state for the dashboard page
 */

import React from 'react';
import { Skeleton, StatsCardSkeleton } from '@/shared/components/ui/Skeleton';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton variant="text" width="200px" height={28} />
                    <Skeleton variant="text" width="150px" height={16} className="mt-2" />
                </div>
                <Skeleton variant="rounded" width={120} height={40} />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatsCardSkeleton key={i} />
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

                {/* Chart 2 */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <Skeleton variant="text" width="40%" height={20} className="mb-4" />
                    <div className="flex items-center justify-center" style={{ height: 200 }}>
                        <Skeleton variant="circular" width={160} height={160} />
                    </div>
                </div>
            </div>

            {/* Recent transactions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <Skeleton variant="text" width="30%" height={20} className="mb-4" />
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                            <Skeleton variant="circular" width={40} height={40} />
                            <div className="flex-1">
                                <Skeleton variant="text" width="60%" height={16} />
                                <Skeleton variant="text" width="40%" height={14} className="mt-1" />
                            </div>
                            <Skeleton variant="text" width={80} height={20} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
