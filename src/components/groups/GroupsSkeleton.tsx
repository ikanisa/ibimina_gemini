/**
 * Groups Skeleton Loader
 * Loading state for the groups page
 */

import React from 'react';
import { Skeleton, TableRowSkeleton } from '../ui/Skeleton';

export const GroupsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header with search and actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Skeleton variant="text" width="160px" height={28} />
                    <Skeleton variant="text" width="100px" height={16} className="mt-2" />
                </div>
                <div className="flex gap-3">
                    <Skeleton variant="rounded" width={200} height={40} />
                    <Skeleton variant="rounded" width={100} height={40} />
                    <Skeleton variant="rounded" width={120} height={40} />
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <Skeleton variant="text" width="60%" height={14} />
                        <Skeleton variant="text" width="40%" height={28} className="mt-2" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Table header */}
                <div className="px-6 py-4 border-b border-slate-200 flex gap-4 bg-slate-50">
                    <Skeleton variant="text" width="20%" height={14} />
                    <Skeleton variant="text" width="10%" height={14} />
                    <Skeleton variant="text" width="15%" height={14} />
                    <Skeleton variant="text" width="15%" height={14} />
                    <Skeleton variant="text" width="15%" height={14} />
                    <Skeleton variant="text" width="10%" height={14} />
                    <Skeleton variant="text" width="5%" height={14} />
                </div>

                {/* Table rows */}
                <table className="w-full">
                    <tbody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <TableRowSkeleton key={i} columns={7} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GroupsSkeleton;
