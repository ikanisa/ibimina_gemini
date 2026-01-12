/**
 * Profile Management Component
 * Allows users to view and edit their profile
 */

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Camera, Save, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileData {
    full_name: string;
    email: string;
    phone: string;
    branch: string;
    avatar_url: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ProfileManagement: React.FC = () => {
    const { user, profile } = useAuth();
    const [formData, setFormData] = useState<ProfileData>({
        full_name: '',
        email: '',
        phone: '',
        branch: '',
        avatar_url: null,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                email: profile.email || user?.email || '',
                phone: '',
                branch: profile.branch || '',
                avatar_url: profile.avatar_url || null,
            });
        } else if (user) {
            setFormData((prev) => ({
                ...prev,
                email: user.email || '',
            }));
        }
    }, [profile, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    branch: formData.branch,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 1024 * 1024) {
            setError('Image must be less than 1MB');
            return;
        }

        setSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            await supabase
                .from('profiles')
                .update({ avatar_url: urlData.publicUrl })
                .eq('user_id', user.id);

            setFormData((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload avatar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Profile Settings</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            {formData.avatar_url ? (
                                <img
                                    src={formData.avatar_url}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={40} className="text-slate-400" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                            <Camera size={16} className="text-white" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="sr-only"
                            />
                        </label>
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{formData.full_name || 'Your Name'}</p>
                        <p className="text-sm text-slate-500">{profile?.role || 'Staff'}</p>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        Profile updated successfully!
                    </div>
                )}

                {/* Form Fields */}
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Branch
                        </label>
                        <div className="relative">
                            <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your branch"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileManagement;
