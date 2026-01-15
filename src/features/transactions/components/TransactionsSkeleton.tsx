/**
 * Transactions Skeleton Loader
 * Loading state for the transactions page
 */

import React from 'react';
import { Skeleton, TableRowSkeleton } from '../ui/Skeleton';

export const TransactionsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header with filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Skeleton variant="text" width="180px" height={28} />
                    <Skeleton variant="text" width="120px" height={16} className="mt-2" />
                </div>
                <div className="flex gap-3">
                    <Skeleton variant="rounded" width={180} height={40} />
                    <Skeleton variant="rounded" width={100} height={40} />
                    <Skeleton variant="rounded" width={100} height={40} />
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <Skeleton variant="text" width="50%" height={14} />
                        <Skeleton variant="text" width="30%" height={24} className="mt-2" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Table header */}
                <div className="px-6 py-4 border-b border-slate-200 flex gap-4">
                    <Skeleton variant="text" width="15%" height={14} />
                    <Skeleton variant="text" width="20%" height={14} />
                    <Skeleton variant="text" width="15%" height={14} />
                    <Skeleton variant="text" width="20%" height={14} />
                    <Skeleton variant="text" width="10%" height={14} />
                    <Skeleton variant="text" width="10%" height={14} />
                </div>

                {/* Table rows */}
                <table className="w-full">
                    <tbody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <TableRowSkeleton key={i} columns={6} />
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <Skeleton variant="text" width="150px" height={14} />
                    <div className="flex gap-2">
                        <Skeleton variant="rounded" width={80} height={32} />
                        <Skeleton variant="rounded" width={32} height={32} />
                        <Skeleton variant="rounded" width={32} height={32} />
                        <Skeleton variant="rounded" width={32} height={32} />
                        <Skeleton variant="rounded" width={80} height={32} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionsSkeleton;
