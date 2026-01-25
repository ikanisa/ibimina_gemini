/**
 * Audit Log Viewer Component
 * Displays security audit logs for administrators
 */

import React, { useState, useEffect } from 'react';
import {
    Shield,
    User,
    Users,
    Receipt,
    Settings,
    Clock,
    ChevronDown,
    ChevronRight,
    Filter,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Pagination } from '../ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

// ============================================================================
// TYPES
// ============================================================================

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    institution_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown> | null;
    previous_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    created_at: string;
    // Joined data
    user_email?: string;
}

interface AuditLogViewerProps {
    institutionId?: string;
    className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const actionIcons: Record<string, React.ReactNode> = {
    'auth.login': <User size={16} className="text-green-500" />,
    'auth.logout': <User size={16} className="text-slate-400" />,
    'auth.login_failed': <User size={16} className="text-red-500" />,
    'member.create': <Users size={16} className="text-blue-500" />,
    'member.update': <Users size={16} className="text-amber-500" />,
    'transaction.create': <Receipt size={16} className="text-green-500" />,
    'transaction.approve': <Receipt size={16} className="text-green-600" />,
    'settings.update': <Settings size={16} className="text-purple-500" />,
};

const actionLabels: Record<string, string> = {
    'auth.login': 'User logged in',
    'auth.logout': 'User logged out',
    'auth.login_failed': 'Login failed',
    'auth.password_reset_request': 'Password reset requested',
    'auth.password_reset_complete': 'Password reset completed',
    'auth.session_expired': 'Session expired',
    'member.create': 'Member created',
    'member.update': 'Member updated',
    'member.delete': 'Member deleted',
    'member.suspend': 'Member suspended',
    'transaction.create': 'Transaction created',
    'transaction.approve': 'Transaction approved',
    'transaction.reject': 'Transaction rejected',
    'transaction.reverse': 'Transaction reversed',
    'group.create': 'Group created',
    'group.update': 'Group updated',
    'group.member_add': 'Member added to group',
    'group.member_remove': 'Member removed from group',
    'settings.update': 'Settings updated',
    'settings.security_change': 'Security settings modified',
    'staff.create': 'Staff member created',
    'staff.role_change': 'Staff role changed',
};

function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getActionLabel(action: string): string {
    return actionLabels[action] || action.replace('.', ' ').replace(/_/g, ' ');
}

function getActionIcon(action: string): React.ReactNode {
    return actionIcons[action] || <Shield size={16} className="text-slate-400" />;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
    institutionId,
    className = '',
}) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');

    const pagination = usePagination(
        filter === 'all' ? logs : logs.filter((l) => l.action.startsWith(filter)),
        { initialPageSize: 20 }
    );

    useEffect(() => {
        fetchLogs();
    }, [institutionId]);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);

            if (institutionId) {
                query = query.eq('institution_id', institutionId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            setLogs(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const filterOptions = [
        { value: 'all', label: 'All Events' },
        { value: 'auth', label: 'Authentication' },
        { value: 'member', label: 'Members' },
        { value: 'transaction', label: 'Transactions' },
        { value: 'group', label: 'Groups' },
        { value: 'settings', label: 'Settings' },
    ];

    if (loading) {
        return (
            <div className={`space-y-3 ${className}`}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton variant="circular" width={32} height={32} />
                            <div className="flex-1">
                                <Skeleton variant="text" width="40%" height={16} />
                                <Skeleton variant="text" width="25%" height={14} className="mt-1" />
                            </div>
                            <Skeleton variant="text" width={100} height={14} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
                <button
                    onClick={fetchLogs}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                    <RefreshCw size={14} />
                    Retry
                </button>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <EmptyState
                icon={Shield}
                title="No audit logs"
                description="Audit logs will appear here once actions are recorded."
                className={className}
            />
        );
    }

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Audit Log</h2>
                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <div className="relative">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-8 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {filterOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <Filter size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchLogs}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Log list */}
            <div className="space-y-2">
                {pagination.items.map((log) => (
                    <div
                        key={log.id}
                        className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                    >
                        {/* Main row */}
                        <button
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                {getActionIcon(log.action)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {getActionLabel(log.action)}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {log.resource_type}: {log.resource_id.slice(0, 8)}...
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Clock size={14} />
                                {formatDateTime(log.created_at)}
                            </div>

                            {(log.metadata || log.previous_value || log.new_value) && (
                                expandedId === log.id ? (
                                    <ChevronDown size={18} className="text-slate-400" />
                                ) : (
                                    <ChevronRight size={18} className="text-slate-400" />
                                )
                            )}
                        </button>

                        {/* Expanded details */}
                        {expandedId === log.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-xs text-slate-500 uppercase">User ID</span>
                                        <p className="text-slate-700 font-mono text-xs">{log.user_id}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500 uppercase">IP Address</span>
                                        <p className="text-slate-700">{log.ip_address || 'N/A'}</p>
                                    </div>
                                </div>

                                {log.metadata && (
                                    <div className="mt-4">
                                        <span className="text-xs text-slate-500 uppercase">Metadata</span>
                                        <pre className="mt-1 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {(log.previous_value || log.new_value) && (
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        {log.previous_value && (
                                            <div>
                                                <span className="text-xs text-slate-500 uppercase">Previous</span>
                                                <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(log.previous_value, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {log.new_value && (
                                            <div>
                                                <span className="text-xs text-slate-500 uppercase">New</span>
                                                <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(log.new_value, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-4">
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        startIndex={pagination.startIndex}
                        endIndex={pagination.endIndex}
                        hasNextPage={pagination.hasNextPage}
                        hasPreviousPage={pagination.hasPreviousPage}
                        pageRange={pagination.pageRange}
                        onPageChange={pagination.goToPage}
                        onNextPage={pagination.nextPage}
                        onPreviousPage={pagination.previousPage}
                        variant="compact"
                    />
                </div>
            )}
        </div>
    );
};

export default AuditLogViewer;
