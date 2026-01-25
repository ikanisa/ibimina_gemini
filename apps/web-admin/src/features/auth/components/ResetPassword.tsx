import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// COMPONENT: RESET PASSWORD
// Handles password reset when user clicks the email link
// ============================================================================

interface ResetPasswordProps {
    onComplete: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password strength indicators - updated to 12 char minimum per security audit
    const hasMinLength = password.length >= 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!isPasswordStrong) {
            setError('Password does not meet minimum requirements');
            return;
        }

        setLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);

        // Redirect after 3 seconds
        setTimeout(() => {
            onComplete();
        }, 3000);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Updated!</h1>
                    <p className="text-slate-500 mb-6">
                        Your password has been successfully updated. You can now sign in with your new password.
                    </p>
                    <p className="text-sm text-slate-400">Redirecting to sign in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Lock className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
                    <p className="text-slate-500 mt-2">
                        Create a strong password for your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Enter new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Password strength indicators */}
                    <div className="space-y-2 text-sm">
                        <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-slate-400'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-green-100' : 'bg-slate-100'}`}>
                                {hasMinLength && <CheckCircle size={12} />}
                            </div>
                            At least 12 characters
                        </div>
                        <div className={`flex items-center gap-2 ${hasUppercase && hasLowercase ? 'text-green-600' : 'text-slate-400'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasUppercase && hasLowercase ? 'bg-green-100' : 'bg-slate-100'}`}>
                                {hasUppercase && hasLowercase && <CheckCircle size={12} />}
                            </div>
                            Upper and lowercase letters
                        </div>
                        <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-slate-400'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasNumber ? 'bg-green-100' : 'bg-slate-100'}`}>
                                {hasNumber && <CheckCircle size={12} />}
                            </div>
                            At least one number
                        </div>
                        <div className={`flex items-center gap-2 ${hasSpecial ? 'text-green-600' : 'text-slate-400'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasSpecial ? 'bg-green-100' : 'bg-slate-100'}`}>
                                {hasSpecial && <CheckCircle size={12} />}
                            </div>
                            At least one special character (!@#$%^&*)
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${confirmPassword && !passwordsMatch ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !isPasswordStrong || !passwordsMatch}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
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
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={onComplete}
                        className="text-slate-600 hover:text-slate-800 text-sm font-medium flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={16} /> Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
