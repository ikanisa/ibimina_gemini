
import React, { useState } from 'react';
import { Save, Globe, Shield, Database, Smartphone, Bell, CreditCard } from 'lucide-react';

type SettingsTab = 'General' | 'Integrations' | 'Security' | 'Notifications';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm">
            <Save size={16} /> Save Changes
        </button>
      </div>

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
                            <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" defaultValue="SACCO+ Admin Portal" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Support Contact Email</label>
                            <input type="email" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" defaultValue="support@saccoplus.rw" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Base Currency</label>
                        <select className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
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
                                <input type="text" className="w-full p-2 bg-white border border-slate-300 rounded text-sm font-mono text-slate-600" defaultValue="https://xyz.supabase.co" readOnly />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Public Key (Anon)</label>
                                <div className="flex gap-2">
                                    <input type="password" value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full p-2 bg-white border border-slate-300 rounded text-sm font-mono text-slate-600" readOnly />
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
                                    <input type="text" className="w-full p-2 bg-white border border-slate-300 rounded text-sm" defaultValue="*182*8*1#" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Merchant ID</label>
                                    <input type="text" className="w-full p-2 bg-white border border-slate-300 rounded text-sm" defaultValue="M-882910" />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded text-blue-600" defaultChecked />
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
