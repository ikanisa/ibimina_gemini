/**
 * System Configuration Panel
 * Allows admins to configure system-wide settings
 */

import React, { useState, useEffect } from 'react';
import {
    Settings,
    Save,
    Loader,
    AlertCircle,
    Check,
    Clock,
    Bell,
    Shield,
    Database,
    Mail,
    Globe
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface SystemConfig {
    session_timeout_minutes: number;
    max_transaction_amount: number;
    require_transaction_approval: boolean;
    approval_threshold: number;
    email_notifications_enabled: boolean;
    sms_notifications_enabled: boolean;
    maintenance_mode: boolean;
    system_timezone: string;
}

interface ConfigPanelProps {
    institutionId: string;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: SystemConfig = {
    session_timeout_minutes: 30,
    max_transaction_amount: 10000000,
    require_transaction_approval: true,
    approval_threshold: 1000000,
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
    maintenance_mode: false,
    system_timezone: 'Africa/Kigali',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SystemConfigPanel: React.FC<ConfigPanelProps> = ({ institutionId }) => {
    const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadConfig();
    }, [institutionId]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('institution_settings')
                .select('*')
                .eq('institution_id', institutionId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (data) {
                setConfig({ ...DEFAULT_CONFIG, ...data.config });
            }
        } catch (err) {
            console.error('Failed to load config:', err);
            // Use defaults on error
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: keyof SystemConfig, value: any) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSuccess(false);
        setError(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const { error: upsertError } = await supabase
                .from('institution_settings')
                .upsert({
                    institution_id: institutionId,
                    config,
                    updated_at: new Date().toISOString(),
                });

            if (upsertError) throw upsertError;

            setSuccess(true);
            setHasChanges(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

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
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">System Configuration</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure institution-wide settings
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <Loader size={18} className="animate-spin" />
                    ) : success ? (
                        <Check size={18} />
                    ) : (
                        <Save size={18} />
                    )}
                    {success ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                {/* Session Settings */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={20} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Session Settings</h3>
                    </div>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Session Timeout (minutes)
                            </label>
                            <input
                                type="number"
                                min={5}
                                max={120}
                                value={config.session_timeout_minutes}
                                onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Auto-logout after inactivity</p>
                        </div>
                    </div>
                </div>

                {/* Transaction Settings */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Database size={20} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Transaction Settings</h3>
                    </div>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Maximum Transaction Amount (RWF)
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={config.max_transaction_amount}
                                onChange={(e) => handleChange('max_transaction_amount', parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="font-medium text-slate-700">Require Approval</label>
                                <p className="text-sm text-slate-500">Transactions above threshold need manager approval</p>
                            </div>
                            <button
                                onClick={() => handleChange('require_transaction_approval', !config.require_transaction_approval)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.require_transaction_approval ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.require_transaction_approval ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {config.require_transaction_approval && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Approval Threshold (RWF)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={config.approval_threshold}
                                    onChange={(e) => handleChange('approval_threshold', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Transactions above this need approval</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell size={20} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="font-medium text-slate-700">Email Notifications</label>
                                <p className="text-sm text-slate-500">Send transaction receipts via email</p>
                            </div>
                            <button
                                onClick={() => handleChange('email_notifications_enabled', !config.email_notifications_enabled)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.email_notifications_enabled ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.email_notifications_enabled ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="font-medium text-slate-700">SMS Notifications</label>
                                <p className="text-sm text-slate-500">Send transaction alerts via SMS</p>
                            </div>
                            <button
                                onClick={() => handleChange('sms_notifications_enabled', !config.sms_notifications_enabled)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.sms_notifications_enabled ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.sms_notifications_enabled ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings size={20} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-900">System</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Timezone
                            </label>
                            <select
                                value={config.system_timezone}
                                onChange={(e) => handleChange('system_timezone', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Africa/Kigali">Africa/Kigali (CAT)</option>
                                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between py-2 border-t border-slate-200 pt-4">
                            <div>
                                <label className="font-medium text-red-700">Maintenance Mode</label>
                                <p className="text-sm text-slate-500">Disable access for non-admin users</p>
                            </div>
                            <button
                                onClick={() => handleChange('maintenance_mode', !config.maintenance_mode)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.maintenance_mode ? 'bg-red-600' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.maintenance_mode ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemConfigPanel;
