
import React, { useEffect, useState } from 'react';
import { Save, Globe, Shield, Database, Smartphone, Bell, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { SupabaseSettings } from '../types';

type SettingsTab = 'General' | 'Integrations' | 'Security' | 'Notifications';

const Settings: React.FC = () => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const [settings, setSettings] = useState<SupabaseSettings | null>(null);
  const [draft, setDraft] = useState({
    system_name: 'SACCO+ Admin Portal',
    support_email: 'support@saccoplus.rw',
    base_currency: 'RWF',
    momo_shortcode: '',
    momo_merchant_id: '',
    auto_reconcile: true,
    notifications_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useMockData) {
      return;
    }
    if (!institutionId) {
      setSettings(null);
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('institution_id', institutionId)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        setError('Unable to load settings. Check your connection and permissions.');
        setLoading(false);
        return;
      }

      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from('settings')
          .insert({ institution_id: institutionId })
          .select('*')
          .single();

        if (insertError) {
          console.error('Error initializing settings:', insertError);
          setError('Unable to initialize settings.');
          setLoading(false);
          return;
        }

        setSettings(inserted as SupabaseSettings);
        setDraft({
          system_name: inserted.system_name,
          support_email: inserted.support_email ?? '',
          base_currency: inserted.base_currency,
          momo_shortcode: inserted.momo_shortcode ?? '',
          momo_merchant_id: inserted.momo_merchant_id ?? '',
          auto_reconcile: inserted.auto_reconcile,
          notifications_enabled: inserted.notifications_enabled
        });
      } else {
        const loaded = data as SupabaseSettings;
        setSettings(loaded);
        setDraft({
          system_name: loaded.system_name,
          support_email: loaded.support_email ?? '',
          base_currency: loaded.base_currency,
          momo_shortcode: loaded.momo_shortcode ?? '',
          momo_merchant_id: loaded.momo_merchant_id ?? '',
          auto_reconcile: loaded.auto_reconcile,
          notifications_enabled: loaded.notifications_enabled
        });
      }

      setLoading(false);
    };

    loadSettings();
  }, [useMockData, institutionId]);

  const handleSave = async () => {
    if (useMockData) return;
    if (!institutionId) return;

    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from('settings')
      .upsert({ institution_id: institutionId, ...draft }, { onConflict: 'institution_id' })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving settings:', error);
      setError('Unable to save settings. Check your connection and permissions.');
      setSaving(false);
      return;
    }

    setSettings(data as SupabaseSettings);
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
            {[
                { id: 'General', icon: Globe },
                { id: 'Integrations', icon: Database },
                { id: 'Security', icon: Shield },
                { id: 'Notifications', icon: Bell },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${
                        activeTab === tab.id 
                        ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.id}
                </button>
            ))}
        </div>

        <div className="p-8">
            {activeTab === 'General' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">System Name</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={draft.system_name}
                              onChange={(e) => setDraft({ ...draft, system_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Support Contact Email</label>
                            <input
                              type="email"
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={draft.support_email}
                              onChange={(e) => setDraft({ ...draft, support_email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Base Currency</label>
                        <select
                          className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={draft.base_currency}
                          onChange={(e) => setDraft({ ...draft, base_currency: e.target.value })}
                        >
                            <option value="RWF">Rwandan Franc (RWF)</option>
                            <option value="USD">US Dollar (USD)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Changing base currency requires full ledger re-calculation.</p>
                    </div>
                </div>
            )}

            {activeTab === 'Integrations' && (
                <div className="space-y-8">
                    <div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Database size={18} className="text-green-600" /> Supabase Configuration
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project URL</label>
                                    <input type="text" className="w-full p-2 bg-white border border-slate-300 rounded text-sm font-mono text-slate-600" value={import.meta.env.VITE_SUPABASE_URL ?? ''} readOnly />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Public Key (Anon)</label>
                                <div className="flex gap-2">
                                    <input type="password" value={import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••••••' : ''} className="w-full p-2 bg-white border border-slate-300 rounded text-sm font-mono text-slate-600" readOnly />
                                    <button className="text-xs text-blue-600 font-medium hover:underline">Reveal</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Smartphone size={18} className="text-yellow-600" /> Mobile Money Gateway
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shortcode (MoMo)</label>
                                    <input
                                      type="text"
                                      className="w-full p-2 bg-white border border-slate-300 rounded text-sm"
                                      value={draft.momo_shortcode}
                                      onChange={(e) => setDraft({ ...draft, momo_shortcode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Merchant ID</label>
                                    <input
                                      type="text"
                                      className="w-full p-2 bg-white border border-slate-300 rounded text-sm"
                                      value={draft.momo_merchant_id}
                                      onChange={(e) => setDraft({ ...draft, momo_merchant_id: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="rounded text-blue-600"
                                      checked={draft.auto_reconcile}
                                      onChange={(e) => setDraft({ ...draft, auto_reconcile: e.target.checked })}
                                    />
                                    <span className="text-sm text-slate-700 font-medium">Enable Auto-Reconciliation via SMS Parsing</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Security' && (
                <div className="space-y-6">
                    <div className="p-4 border border-red-100 bg-red-50 rounded-lg">
                        <h4 className="text-red-800 font-bold text-sm mb-1">Danger Zone</h4>
                        <p className="text-red-600 text-xs">These settings affect global access control.</p>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Force 2FA for Staff</p>
                                <p className="text-xs text-slate-500">Require all staff roles to use 2-factor authentication</p>
                            </div>
                            <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full bg-green-500">
                                <span className="absolute left-5 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></span>
                            </div>
                        </label>
                        <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">NFC Device Whitelisting</p>
                                <p className="text-xs text-slate-500">Only allow registered POS devices to initiate transactions</p>
                            </div>
                            <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full bg-slate-300">
                                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></span>
                            </div>
                        </label>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
