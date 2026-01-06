/**
 * Add Staff Modal Component
 * 
 * Modal for creating new staff members with validation
 */

import React, { useState } from 'react';
import {
    Plus, X, User, Mail, Building, Lock, KeyRound, Loader2
} from 'lucide-react';
import { StaffRole, SupabaseProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { mapStaffRole, mapStaffStatus } from '../../lib/mappers';
import { buildInitialsAvatar } from '../../lib/avatars';
import { Modal } from '../ui';

interface NewStaffData {
    name: string;
    email: string;
    role: StaffRole;
    branch: string;
    status: 'Active' | 'Suspended';
    onboardingMethod: 'invite' | 'password';
    password: string;
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
    useMockData: boolean;
}

const initialFormData: NewStaffData = {
    name: '',
    email: '',
    role: 'Teller',
    branch: '',
    status: 'Active',
    onboardingMethod: 'invite',
    password: ''
};

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    institutionId,
    useMockData
}) => {
    const [formData, setFormData] = useState<NewStaffData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Full name is required";
        if (!formData.email.trim()) errors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
        if (!formData.branch.trim()) errors.branch = "Branch assignment is required";

        if (formData.onboardingMethod === 'password') {
            if (!formData.password) errors.password = "Temporary password is required";
            else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        if (useMockData) {
            setTimeout(() => {
                setIsSubmitting(false);
                onSuccess({
                    id: `mock-${Date.now()}`,
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    branch: formData.branch,
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
                branch: formData.branch,
                institution_id: institutionId,
                onboarding_method: formData.onboardingMethod,
                password: formData.onboardingMethod === 'password' ? formData.password : undefined
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
                branch: newProfile.branch || formData.branch,
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

                    {/* Role & Branch */}
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
                                <option value="Teller">Teller</option>
                                <option value="Loan Officer">Loan Officer</option>
                                <option value="Branch Manager">Branch Manager</option>
                                <option value="Super Admin">Super Admin</option>
                                <option value="Auditor">Auditor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                                Branch <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.branch ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                        }`}
                                    placeholder="Assign Branch"
                                    value={formData.branch}
                                    onChange={e => setFormData({ ...formData, branch: e.target.value })}
                                />
                            </div>
                            {formErrors.branch && <p className="text-red-500 text-xs mt-1">{formErrors.branch}</p>}
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

                    {/* Onboarding Method */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-3">
                            Onboarding Method
                        </label>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, onboardingMethod: 'invite' })}
                                className={`p-3 border rounded-lg text-left transition-all ${formData.onboardingMethod === 'invite'
                                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                        : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-1">
                                    <Mail size={16} /> Send Invitation
                                </div>
                                <p className="text-xs text-slate-500">Email link to set password</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, onboardingMethod: 'password' })}
                                className={`p-3 border rounded-lg text-left transition-all ${formData.onboardingMethod === 'password'
                                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                        : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-1">
                                    <Lock size={16} /> Set Password
                                </div>
                                <p className="text-xs text-slate-500">Manually create password</p>
                            </button>
                        </div>

                        {formData.onboardingMethod === 'password' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                                    Temporary Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="password"
                                        className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                            }`}
                                        placeholder="Enter temporary password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                            </div>
                        )}
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
