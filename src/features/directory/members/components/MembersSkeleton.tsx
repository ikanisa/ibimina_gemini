/**
 * Members Skeleton Loader
 * Loading state for the members page
 */

import React from 'react';
import { Skeleton, ListItemSkeleton } from '@/shared/components/ui/Skeleton';

export const MembersSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Skeleton variant="text" width="160px" height={28} />
                    <Skeleton variant="text" width="100px" height={16} className="mt-2" />
                </div>
                <div className="flex gap-3">
                    <Skeleton variant="rounded" width={200} height={40} />
                    <Skeleton variant="rounded" width={120} height={40} />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <Skeleton variant="text" width="60%" height={14} />
                        <Skeleton variant="text" width="40%" height={24} className="mt-2" />
                    </div>
                ))}
            </div>

            {/* Member list */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search/filter bar */}
                <div className="px-6 py-4 border-b border-slate-200 flex gap-4">
                    <Skeleton variant="rounded" width="100%" height={40} />
                </div>

                {/* Member items */}
                <div className="divide-y divide-slate-100">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ListItemSkeleton key={i} />
                    ))}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <Skeleton variant="text" width="120px" height={14} />
                    <div className="flex gap-2">
                        <Skeleton variant="rounded" width={32} height={32} />
                        <Skeleton variant="rounded" width={32} height={32} />
                        <Skeleton variant="rounded" width={32} height={32} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MembersSkeleton;
