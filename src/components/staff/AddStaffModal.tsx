/**
 * Add Staff Modal Component
 * 
 * Modal for creating new staff members with validation.
 * Admin sets email and password, then shares credentials with staff.
 */

import React, { useState, useEffect } from 'react';
import {
    User, Mail, Building, Loader2, Eye, EyeOff, Lock, CheckCircle, Copy, Check
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
    password: string;
    role: StaffRole;
    institution_id: string;
    status: 'Active' | 'Suspended';
}

interface CreatedStaffCredentials {
    email: string;
    password: string;
    name: string;
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
}

const initialFormData: NewStaffData = {
    name: '',
    email: '',
    password: '',
    role: 'Staff',
    institution_id: '',
    status: 'Active',
};

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    institutionId,
}) => {
    const { role: userRole, institutionId: userInstitutionId } = useAuth();
    const isPlatformAdmin = isSuperAdmin(userRole);

    const [formData, setFormData] = useState<NewStaffData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loadingInstitutions, setLoadingInstitutions] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Success state - show credentials after creation
    const [createdCredentials, setCreatedCredentials] = useState<CreatedStaffCredentials | null>(null);
    const [copiedField, setCopiedField] = useState<'email' | 'password' | 'all' | null>(null);

    // Password strength indicators
    const hasMinLength = formData.password.length >= 8;
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber;

    // Load institutions for platform admins
    useEffect(() => {
        if (isOpen && isPlatformAdmin) {
            loadInstitutions();
        } else if (isOpen && userInstitutionId) {
            setFormData(prev => ({ ...prev, institution_id: userInstitutionId }));
        }
    }, [isOpen, isPlatformAdmin, userInstitutionId]);

    // Reset on modal close
    useEffect(() => {
        if (!isOpen) {
            setFormData(initialFormData);
            setFormErrors({});
            setCreatedCredentials(null);
            setCopiedField(null);
        }
    }, [isOpen]);

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
        if (!formData.password.trim()) errors.password = "Password is required";
        else if (!isPasswordStrong) errors.password = "Password does not meet requirements";
        if (!formData.institution_id) errors.institution_id = "Institution is required";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        const { data, error } = await supabase.functions.invoke('staff-invite', {
            body: {
                email: formData.email,
                full_name: formData.name,
                role: formData.role,
                institution_id: formData.institution_id || institutionId,
                onboarding_method: 'password',
                password: formData.password
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

            // Show credentials for copying
            setCreatedCredentials({
                email: formData.email,
                password: formData.password,
                name: formData.name
            });

            // Notify parent of success
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
    };

    const handleClose = () => {
        setFormData(initialFormData);
        setFormErrors({});
        setCreatedCredentials(null);
        setCopiedField(null);
        onClose();
    };

    const copyToClipboard = async (text: string, field: 'email' | 'password' | 'all') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const copyAllCredentials = () => {
        if (!createdCredentials) return;
        const text = `Staff Account Credentials\n\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nPlease log in and change your password.`;
        copyToClipboard(text, 'all');
    };

    // Success state - show credentials
    if (createdCredentials) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Staff Created Successfully" size="lg">
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {createdCredentials.name} has been added
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Share these credentials with the staff member
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        {/* Email */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Email</p>
                                <p className="text-sm font-mono text-slate-900">{createdCredentials.email}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                {copiedField === 'email' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                            </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Password</p>
                                <p className="text-sm font-mono text-slate-900">{createdCredentials.password}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(createdCredentials.password, 'password')}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                {copiedField === 'password' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Copy All Button */}
                    <button
                        onClick={copyAllCredentials}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        {copiedField === 'all' ? (
                            <>
                                <Check size={18} /> Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={18} /> Copy All Credentials
                            </>
                        )}
                    </button>

                    <p className="text-xs text-slate-500 text-center mt-4">
                        Staff should change their password after first login.
                    </p>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </Modal>
        );
    }

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
                                className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'
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
                                className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                    }`}
                                placeholder="john.m@saccoplus.rw"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                    }`}
                                placeholder="Enter password for staff"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}

                        {/* Password strength indicators */}
                        {formData.password && (
                            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-600' : 'text-slate-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    8+ characters
                                </div>
                                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-green-600' : 'text-slate-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    Uppercase
                                </div>
                                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-green-600' : 'text-slate-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${hasLowercase ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    Lowercase
                                </div>
                                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-600' : 'text-slate-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    Number
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Role & Institution */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.institution_id ? 'border-red-300 bg-red-50' : 'border-slate-200'
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
