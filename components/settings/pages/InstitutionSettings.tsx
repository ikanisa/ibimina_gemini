import React, { useState, useEffect } from 'react';
import { Building, CreditCard, Plus, Star, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { SettingsCard } from '../SettingsCard';
import { SettingsRow } from '../SettingsRow';
import { DrawerForm } from '../DrawerForm';
import { SaveBar } from '../SaveBar';
import { HealthBanner } from '../HealthBanner';

interface InstitutionProfile {
  id: string;
  name: string;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
}

interface MomoCode {
  id: string;
  momo_code: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export const InstitutionSettings: React.FC = () => {
  const { institutionId } = useAuth();
  const [institution, setInstitution] = useState<InstitutionProfile | null>(null);
  const [momoCodes, setMomoCodes] = useState<MomoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState<'profile' | 'momo' | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOtherCodes, setShowOtherCodes] = useState(false);
  
  // Form state
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    contact_email: '',
    contact_phone: ''
  });
  const [newMomoCode, setNewMomoCode] = useState('');

  useEffect(() => {
    loadData();
  }, [institutionId]);

  const loadData = async () => {
    if (!institutionId) return;
    
    setLoading(true);
    
    // Load institution profile
    const { data: instData } = await supabase
      .from('institutions')
      .select('*')
      .eq('id', institutionId)
      .single();
    
    if (instData) {
      setInstitution(instData);
      setProfileDraft({
        name: instData.name || '',
        contact_email: instData.contact_email || '',
        contact_phone: instData.contact_phone || ''
      });
    }
    
    // Load MoMo codes
    const { data: momoData } = await supabase
      .from('institution_momo_codes')
      .select('*')
      .eq('institution_id', institutionId)
      .order('is_primary', { ascending: false });
    
    if (momoData) {
      setMomoCodes(momoData);
    }
    
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!institutionId) return;
    
    setIsSaving(true);
    
    const { error } = await supabase.rpc('update_institution_settings', {
      p_institution_id: institutionId,
      p_name: profileDraft.name,
      p_contact_email: profileDraft.contact_email || null,
      p_contact_phone: profileDraft.contact_phone || null
    });
    
    if (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } else {
      await loadData();
      setShowDrawer(null);
      setIsDirty(false);
    }
    
    setIsSaving(false);
  };

  const handleAddMomoCode = async () => {
    if (!institutionId || !newMomoCode.trim()) return;
    
    setIsSaving(true);
    
    const { error } = await supabase.rpc('set_institution_momo_code', {
      p_institution_id: institutionId,
      p_momo_code: newMomoCode.trim(),
      p_is_primary: momoCodes.length === 0 // First code is primary
    });
    
    if (error) {
      console.error('Error adding MoMo code:', error);
      alert('Failed to add MoMo code. Please try again.');
    } else {
      await loadData();
      setNewMomoCode('');
      setShowDrawer(null);
    }
    
    setIsSaving(false);
  };

  const handleSetPrimary = async (codeId: string) => {
    if (!institutionId) return;
    
    const code = momoCodes.find(c => c.id === codeId);
    if (!code) return;
    
    const { error } = await supabase.rpc('set_institution_momo_code', {
      p_institution_id: institutionId,
      p_momo_code: code.momo_code,
      p_is_primary: true
    });
    
    if (error) {
      console.error('Error setting primary:', error);
      alert('Failed to set primary code. Please try again.');
    } else {
      await loadData();
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to deactivate this MoMo code?')) return;
    
    const { error } = await supabase
      .from('institution_momo_codes')
      .update({ is_active: false })
      .eq('id', codeId);
    
    if (error) {
      console.error('Error deactivating code:', error);
      alert('Failed to deactivate code. Please try again.');
    } else {
      await loadData();
    }
  };

  const primaryCode = momoCodes.find(c => c.is_primary && c.is_active);
  const otherCodes = momoCodes.filter(c => !c.is_primary && c.is_active);

  const healthIssues = [];
  if (!primaryCode) {
    healthIssues.push({
      type: 'alert' as const,
      message: 'No primary MoMo code configured',
      action: 'Add a MoMo code to receive payments',
      onClick: () => setShowDrawer('momo')
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Institution & MoMo</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your institution profile and payment configurations</p>
      </div>

      <HealthBanner issues={healthIssues} />

      {/* Institution Profile */}
      <SettingsCard
        title="Institution Profile"
        description="Your organization's identity"
        icon={Building}
        action={
          <button
            onClick={() => setShowDrawer('profile')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        }
      >
        <div className="space-y-0">
          <SettingsRow
            label="Institution Name"
            value={institution?.name || 'Not set'}
          />
          <SettingsRow
            label="Status"
            value={
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                institution?.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {institution?.status || 'Unknown'}
              </span>
            }
          />
          <SettingsRow
            label="Contact Email"
            value={institution?.contact_email || 'Not set'}
          />
          <SettingsRow
            label="Contact Phone"
            value={institution?.contact_phone || 'Not set'}
            isLast
          />
        </div>
      </SettingsCard>

      {/* Primary MoMo Code */}
      <SettingsCard
        title="Primary MoMo Code"
        description="The main payment code for receiving transactions"
        icon={CreditCard}
        action={
          <button
            onClick={() => setShowDrawer('momo')}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={14} />
            Add Code
          </button>
        }
      >
        {primaryCode ? (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
                <Star size={20} />
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-slate-900">{primaryCode.momo_code}</p>
                <p className="text-xs text-slate-500">Primary • Active</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <CreditCard size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No primary MoMo code configured</p>
            <button
              onClick={() => setShowDrawer('momo')}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Add MoMo Code
            </button>
          </div>
        )}
      </SettingsCard>

      {/* Other MoMo Codes (collapsed by default) */}
      {otherCodes.length > 0 && (
        <SettingsCard
          title={`Other MoMo Codes (${otherCodes.length})`}
          description="Additional payment codes for this institution"
          icon={CreditCard}
        >
          <button
            onClick={() => setShowOtherCodes(!showOtherCodes)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            {showOtherCodes ? 'Hide codes' : 'Show codes'}
          </button>
          
          {showOtherCodes && (
            <div className="space-y-2">
              {otherCodes.map(code => (
                <div key={code.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-mono text-sm font-medium text-slate-700">{code.momo_code}</p>
                    <p className="text-xs text-slate-500">Added {new Date(code.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetPrimary(code.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Set Primary
                    </button>
                    <button
                      onClick={() => handleDeactivateCode(code.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SettingsCard>
      )}

      {/* Profile Edit Drawer */}
      <DrawerForm
        isOpen={showDrawer === 'profile'}
        onClose={() => {
          setShowDrawer(null);
          setIsDirty(false);
        }}
        title="Edit Institution Profile"
        description="Update your organization's details"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDrawer(null)}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Institution Name
            </label>
            <input
              type="text"
              value={profileDraft.name}
              onChange={(e) => {
                setProfileDraft({ ...profileDraft, name: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter institution name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Contact Email
            </label>
            <input
              type="email"
              value={profileDraft.contact_email}
              onChange={(e) => {
                setProfileDraft({ ...profileDraft, contact_email: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Contact Phone
            </label>
            <input
              type="tel"
              value={profileDraft.contact_phone}
              onChange={(e) => {
                setProfileDraft({ ...profileDraft, contact_phone: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="+250 7XX XXX XXX"
            />
          </div>
        </div>
      </DrawerForm>

      {/* Add MoMo Code Drawer */}
      <DrawerForm
        isOpen={showDrawer === 'momo'}
        onClose={() => {
          setShowDrawer(null);
          setNewMomoCode('');
        }}
        title="Add MoMo Code"
        description="Add a new payment code for receiving transactions"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDrawer(null)}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMomoCode}
              disabled={isSaving || !newMomoCode.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : 'Add Code'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              MoMo Code / Shortcode
            </label>
            <input
              type="text"
              value={newMomoCode}
              onChange={(e) => setNewMomoCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="*182*8*1*XXXXXX#"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Enter the MoMo shortcode or merchant code used for receiving payments
            </p>
          </div>
          {momoCodes.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Star size={16} className="text-blue-600" />
              <p className="text-xs text-blue-700">This will be set as your primary code</p>
            </div>
          )}
        </div>
      </DrawerForm>
    </div>
  );
};

export default InstitutionSettings;

