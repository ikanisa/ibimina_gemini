import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, X, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ============================================================================
// COMPONENT: CHANGE PASSWORD MODAL
// For logged-in users to change their password
// ============================================================================

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password strength indicators
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
    const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber;

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (!isPasswordStrong) {
            setError('Password does not meet minimum requirements');
            return;
        }

        setLoading(true);

        // First verify current password by re-authenticating
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            setError('Unable to verify current session');
            setLoading(false);
            return;
        }

        // Try to sign in with current password to verify it
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (signInError) {
            setError('Current password is incorrect');
            setLoading(false);
            return;
        }

        // Update to new password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);

        // Close after 2 seconds
        setTimeout(() => {
            handleClose();
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Shield className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-100">Change Password</h2>
                            <p className="text-sm text-slate-500 dark:text-neutral-400">Update your account security</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-2">Password Updated!</h3>
                        <p className="text-slate-500 dark:text-neutral-400">Your password has been changed successfully.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-12 border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 dark:text-neutral-100"
                                    placeholder="Enter current password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors"
                                >
                                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <hr className="border-slate-200 dark:border-neutral-700" />

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-12 border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 dark:text-neutral-100"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors"
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Password strength indicators */}
                        {newPassword && (
                            <div className="space-y-1.5 text-xs">
                                <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-neutral-500'}`}>
                                    <CheckCircle size={12} className={hasMinLength ? 'opacity-100' : 'opacity-30'} />
                                    At least 8 characters
                                </div>
                                <div className={`flex items-center gap-2 ${hasUppercase && hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-neutral-500'}`}>
                                    <CheckCircle size={12} className={hasUppercase && hasLowercase ? 'opacity-100' : 'opacity-30'} />
                                    Upper and lowercase letters
                                </div>
                                <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-neutral-500'}`}>
                                    <CheckCircle size={12} className={hasNumber ? 'opacity-100' : 'opacity-30'} />
                                    At least one number
                                </div>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 ${confirmPassword && !passwordsMatch ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-neutral-600'
                                        }`}
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-red-500 dark:text-red-400 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-neutral-600 text-slate-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !isPasswordStrong || !passwordsMatch || !currentPassword}
                                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                        Updating...
                                    </span>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePasswordModal;
