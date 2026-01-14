/**
 * Add Staff Modal Component
 * 
 * Modal for creating new staff members with validation
 */

import React, { useState, useEffect } from 'react';
import {
    Plus, X, User, Mail, Building, Loader2
} from 'lucide-react';
import { StaffRole, SupabaseProfile, Institution } from '../../types';
import { supabase } from '../../lib/supabase';
import { mapStaffRole, mapStaffStatus } from '../../lib/mappers';
import { buildInitialsAvatar } from '../../lib/avatars';
import { Modal } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdmin } from '../../lib/utils/roleHelpers';

interface NewStaffData {
    name: string;
    email: string;
    role: StaffRole;
    institution_id: string;
    status: 'Active' | 'Suspended';
}

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (profile: {
        id: string;
        name: string;
        email: string;
        role: StaffRole;
        branch: string;
        status: 'Active' | 'Suspended';
        lastLogin: string;
        avatarUrl: string;
    }) => void;
    institutionId: string | null;
    // useMockData removed
}

const DEFAULT_PASSWORD = 'Sacco+';

const initialFormData: NewStaffData = {
    name: '',
    email: '',
    role: 'Staff',
    institution_id: '',
    status: 'Active',
};

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    institutionId,
    // useMockData removed
}) => {
    const { role: userRole, institutionId: userInstitutionId } = useAuth();
    const isPlatformAdmin = isSuperAdmin(userRole);

    const [formData, setFormData] = useState<NewStaffData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loadingInstitutions, setLoadingInstitutions] = useState(false);

    // Load institutions for platform admins
    useEffect(() => {
        if (isOpen && isPlatformAdmin) {
            loadInstitutions();
        } else if (isOpen && userInstitutionId) {
            setFormData(prev => ({ ...prev, institution_id: userInstitutionId }));
        }
    }, [isOpen, isPlatformAdmin, userInstitutionId]);

    const loadInstitutions = async () => {
        setLoadingInstitutions(true);
        try {
            const { data, error } = await supabase
                .from('institutions')
                .select('id, name')
                .eq('status', 'ACTIVE')
                .order('name');

            if (error) throw error;
            if (data) {
                // Map to Institution type with required fields
                setInstitutions(data.map((inst: { id: string; name: string }) => ({
                    id: inst.id,
                    name: inst.name,
                    type: 'SACCO' as const,
                    status: 'ACTIVE',
                    created_at: new Date().toISOString(),
                })));
            }
        } catch (err) {
            console.error('Error loading institutions:', err);
            setFormErrors({ submit: 'Failed to load institutions' });
        } finally {
            setLoadingInstitutions(false);
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Full name is required";
        if (!formData.email.trim()) errors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
        if (!formData.institution_id) errors.institution_id = "Institution is required";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        // Mock data removed - always use Supabase
        if (false) {
            setTimeout(() => {
                setIsSubmitting(false);
                onSuccess({
                    id: `mock-${Date.now()}`,
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    branch: '', // Branch field removed
                    status: formData.status,
                    lastLogin: '—',
                    avatarUrl: buildInitialsAvatar(formData.name)
                });
                setFormData(initialFormData);
                onClose();
            }, 1500);
            return;
        }

        const { data, error } = await supabase.functions.invoke('staff-invite', {
            body: {
                email: formData.email,
                full_name: formData.name,
                role: formData.role,
                institution_id: formData.institution_id || institutionId,
                onboarding_method: 'password',
                password: DEFAULT_PASSWORD
            }
        });

        if (error) {
            console.error('Error creating staff:', error);
            setFormErrors({ submit: 'Unable to create staff. Ensure the staff-invite function is deployed.' });
            setIsSubmitting(false);
            return;
        }

        if (data?.profile) {
            const newProfile = data.profile as SupabaseProfile;
            const name = newProfile.full_name || newProfile.email || 'Staff';
            onSuccess({
                id: newProfile.user_id,
                name,
                email: newProfile.email || formData.email,
                role: mapStaffRole(newProfile.role),
                branch: newProfile.branch || '',
                status: mapStaffStatus(newProfile.status),
                lastLogin: newProfile.last_login_at ? new Date(newProfile.last_login_at).toLocaleString() : '—',
                avatarUrl: newProfile.avatar_url || buildInitialsAvatar(name)
            });
        }

        setIsSubmitting(false);
        setFormData(initialFormData);
        onClose();
    };

    const handleClose = () => {
        setFormData(initialFormData);
        setFormErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="New Staff Member" size="lg">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                    }`}
                                placeholder="e.g. John Mugisha"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="email"
                                className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                    }`}
                                placeholder="john.m@saccoplus.rw"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>

                    {/* Role & Institution */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as StaffRole })}
                            >
                                <option value="Staff">Staff</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                                Institution <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                {isPlatformAdmin ? (
                                    <select
                                        className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.institution_id ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                            }`}
                                        value={formData.institution_id}
                                        onChange={e => setFormData({ ...formData, institution_id: e.target.value })}
                                        disabled={loadingInstitutions}
                                    >
                                        <option value="">Select Institution</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-not-allowed"
                                        value={userInstitutionId ? 'Your Institution' : 'No Institution'}
                                        disabled
                                    />
                                )}
                            </div>
                            {formErrors.institution_id && <p className="text-red-500 text-xs mt-1">{formErrors.institution_id}</p>}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Initial Status</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Active'}
                                    onChange={() => setFormData({ ...formData, status: 'Active' })}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Active</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Suspended'}
                                    onChange={() => setFormData({ ...formData, status: 'Suspended' })}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Suspended</span>
                            </label>
                        </div>
                    </div>

                    {/* Password Info */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700">
                                <strong>Default Password:</strong> {DEFAULT_PASSWORD}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Staff will be required to change their password on first login.
                            </p>
                        </div>
                    </div>
                </div>

                {formErrors.submit && (
                    <div className="px-6 pb-2 text-sm text-red-600">
                        {formErrors.submit}
                    </div>
                )}

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Creating...
                            </>
                        ) : (
                            <>Create Staff Member</>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddStaffModal;
