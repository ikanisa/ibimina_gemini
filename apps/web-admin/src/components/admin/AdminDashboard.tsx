/**
 * Admin Dashboard View
 * Dedicated dashboard for administrators with stats, approvals, and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
    Users,
    DollarSign,
    AlertCircle,
    TrendingUp,
    Clock,
    Shield,
    Settings,
    FileText,
    ChevronRight,
    Loader,
    Activity,
    Bell
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    pendingApprovals: number;
    todayTransactions: number;
    transactionVolume: number;
    systemHealth: 'healthy' | 'warning' | 'error';
}

interface RecentActivity {
    id: string;
    type: 'login' | 'transaction' | 'approval' | 'config';
    description: string;
    user: string;
    timestamp: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AdminDashboard: React.FC = () => {
    const { institutionId, role } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        pendingApprovals: 0,
        todayTransactions: 0,
        transactionVolume: 0,
        systemHealth: 'healthy',
    });
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [institutionId]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load stats in parallel
            const [usersData, pendingData, transactionsData] = await Promise.all([
                supabase.from('profiles').select('status', { count: 'exact' }).eq('institution_id', institutionId),
                supabase.from('transactions').select('id', { count: 'exact' }).eq('status', 'pending').eq('requires_approval', true),
                supabase.from('transactions').select('amount').gte('created_at', new Date().toISOString().split('T')[0]),
            ]);

            const totalUsers = usersData.count || 0;
            const activeUsers = usersData.data?.filter((u) => u.status === 'active').length || 0;
            const pendingApprovals = pendingData.count || 0;
            const todayTransactions = transactionsData.data?.length || 0;
            const transactionVolume = transactionsData.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            setStats({
                totalUsers,
                activeUsers,
                pendingApprovals,
                todayTransactions,
                transactionVolume,
                systemHealth: pendingApprovals > 10 ? 'warning' : 'healthy',
            });

            // Load recent activities from audit log
            const { data: auditData } = await supabase
                .from('audit_logs')
                .select('id, action, resource, user_id, created_at, metadata')
                .order('created_at', { ascending: false })
                .limit(5);

            if (auditData) {
                setActivities(
                    auditData.map((a) => ({
                        id: a.id,
                        type: a.resource?.includes('auth') ? 'login' : a.resource?.includes('transaction') ? 'transaction' : 'config',
                        description: `${a.action} on ${a.resource}`,
                        user: a.user_id?.slice(0, 8) || 'System',
                        timestamp: a.created_at,
                    }))
                );
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(amount);
    };

    const quickActions = [
        { icon: Users, label: 'Manage Users', href: '/admin/users', color: 'bg-blue-100 text-blue-600' },
        { icon: Clock, label: 'Pending Approvals', href: '/admin/approvals', color: 'bg-amber-100 text-amber-600' },
        { icon: Shield, label: 'Role Management', href: '/admin/roles', color: 'bg-purple-100 text-purple-600' },
        { icon: Settings, label: 'System Config', href: '/admin/settings', color: 'bg-slate-100 text-slate-600' },
        { icon: FileText, label: 'Audit Logs', href: '/admin/audit', color: 'bg-green-100 text-green-600' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader size={32} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-500 mt-1">System overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Total Users</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalUsers}</p>
                            <p className="text-xs text-green-600 mt-1">{stats.activeUsers} active</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Pending Approvals</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.pendingApprovals}</p>
                            <p className="text-xs text-amber-600 mt-1">Needs attention</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock size={24} className="text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Today's Transactions</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.todayTransactions}</p>
                            <p className="text-xs text-slate-500 mt-1">{formatCurrency(stats.transactionVolume)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">System Health</p>
                            <p className={`text-2xl font-bold mt-1 ${stats.systemHealth === 'healthy' ? 'text-green-600' :
                                    stats.systemHealth === 'warning' ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                {stats.systemHealth === 'healthy' ? 'Healthy' :
                                    stats.systemHealth === 'warning' ? 'Warning' : 'Error'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">All services operational</p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.systemHealth === 'healthy' ? 'bg-green-100' :
                                stats.systemHealth === 'warning' ? 'bg-amber-100' : 'bg-red-100'
                            }`}>
                            <Activity size={24} className={
                                stats.systemHealth === 'healthy' ? 'text-green-600' :
                                    stats.systemHealth === 'warning' ? 'text-amber-600' : 'text-red-600'
                            } />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        {quickActions.map((action) => (
                            <a
                                key={action.label}
                                href={action.href}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                                        <action.icon size={20} />
                                    </div>
                                    <span className="font-medium text-slate-700">{action.label}</span>
                                </div>
                                <ChevronRight size={16} className="text-slate-400" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-900">Recent Activity</h2>
                        <a href="/admin/audit" className="text-sm text-blue-600 hover:text-blue-800">
                            View All
                        </a>
                    </div>
                    {activities.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                            No recent activity
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'login' ? 'bg-blue-100 text-blue-600' :
                                            activity.type === 'transaction' ? 'bg-green-100 text-green-600' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {activity.type === 'login' ? <Users size={16} /> :
                                            activity.type === 'transaction' ? <DollarSign size={16} /> :
                                                <Settings size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-700">{activity.description}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            By {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
