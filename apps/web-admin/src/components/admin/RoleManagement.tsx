/**
 * User Role Management Component
 * Allows admins to manage user roles
 */

import React, { useState, useEffect } from 'react';
import { Shield, User, ChevronDown, Save, Loader, AlertCircle, Check, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

type UserRole = 'Admin' | 'Staff';
type UserStatus = 'active' | 'suspended' | 'inactive';

interface UserProfile {
    user_id: string;
    email: string;
    full_name: string;
    role: UserRole;
    status: UserStatus;
    branch: string | null;
    last_login_at: string | null;
}

interface RoleManagementProps {
    institutionId: string;
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

const ROLES: { value: UserRole; label: string; description: string }[] = [
    { value: 'Admin', label: 'Admin', description: 'Full system access' },
    { value: 'Staff', label: 'Staff', description: 'Standard staff access' },
];

const STATUSES: { value: UserStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'suspended', label: 'Suspended', color: 'bg-amber-100 text-amber-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-slate-100 text-slate-600' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const RoleManagement: React.FC<RoleManagementProps> = ({ institutionId }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ role: UserRole; status: UserStatus } | null>(null);

    useEffect(() => {
        loadUsers();
    }, [institutionId]);

    const loadUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('user_id, email, full_name, role, status, branch, last_login_at')
                .eq('institution_id', institutionId)
                .order('full_name', { ascending: true });

            if (fetchError) throw fetchError;
            setUsers(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: UserProfile) => {
        setEditingUser(user.user_id);
        setEditData({ role: user.role, status: user.status });
    };

    const handleSave = async (userId: string) => {
        if (!editData) return;

        setSaving(userId);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    role: editData.role,
                    status: editData.status,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            setUsers((prev) =>
                prev.map((u) =>
                    u.user_id === userId ? { ...u, role: editData.role, status: editData.status } : u
                )
            );
            setEditingUser(null);
            setEditData(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
        } finally {
            setSaving(null);
        }
    };

    const handleCancel = () => {
        setEditingUser(null);
        setEditData(null);
    };

    const filteredUsers = users.filter(
        (u) =>
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader size={24} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">User Role Management</h2>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Last Login</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => {
                            const isEditing = editingUser === user.user_id;
                            const status = STATUSES.find((s) => s.value === user.status);

                            return (
                                <tr key={user.user_id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                <User size={20} className="text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{user.full_name || 'Unknown'}</p>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <select
                                                value={editData?.role}
                                                onChange={(e) => setEditData((prev) => ({ ...prev!, role: e.target.value as UserRole }))}
                                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {ROLES.map((role) => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                                                <Shield size={14} className="text-slate-400" />
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <select
                                                value={editData?.status}
                                                onChange={(e) => setEditData((prev) => ({ ...prev!, status: e.target.value as UserStatus }))}
                                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {STATUSES.map((s) => (
                                                    <option key={s.value} value={s.value}>
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                                                {status?.label}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500">
                                        {user.last_login_at
                                            ? new Date(user.last_login_at).toLocaleDateString()
                                            : 'Never'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {isEditing ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSave(user.user_id)}
                                                    disabled={saving === user.user_id}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {saving === user.user_id ? (
                                                        <Loader size={14} className="animate-spin" />
                                                    ) : (
                                                        <Check size={14} />
                                                    )}
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        {searchQuery ? 'No users match your search' : 'No users found'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleManagement;
