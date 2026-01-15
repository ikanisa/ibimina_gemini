/**
 * InstitutionDrawer.tsx - Detail drawer for institution management
 * 
 * Tabs:
 * - Overview: Basic info + edit
 * - MoMo Codes: List + set primary
 * - Staff: List staff + invite
 * - Directory: Groups and Members counts
 */
import React, { useState, useEffect } from 'react';
import {
  X, Building, Edit2, Save, Users, CreditCard,
  MapPin, Phone, Mail, User, AlertCircle, Check, Plus,
  Loader2, Shield, Clock, Briefcase
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InstitutionType } from '../../types';

interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  status: string;
  code: string | null;
  supervisor: string | null;
  total_assets: number;
  contact_email: string | null;
  contact_phone: string | null;
  region: string | null;
  created_at: string;
  staff_count?: number;
  groups_count?: number;
  members_count?: number;
  primary_momo_code?: string | null;
}

interface MoMoCode {
  id: string;
  momo_code: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

interface StaffMember {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

interface InstitutionDrawerProps {
  institution: Institution;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  isPlatformAdmin: boolean;
}

type TabId = 'overview' | 'momo' | 'staff' | 'directory';

export const InstitutionDrawer: React.FC<InstitutionDrawerProps> = ({
  institution,
  isOpen,
  onClose,
  onEdit,
  isPlatformAdmin
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState({
    name: institution.name,
    status: institution.status,
    code: institution.code || '',
    supervisor: institution.supervisor || '',
    contact_email: institution.contact_email || '',
    contact_phone: institution.contact_phone || '',
    region: institution.region || ''
  });

  // Tab data
  const [momoCodes, setMomoCodes] = useState<MoMoCode[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingMomo, setLoadingMomo] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [counts, setCounts] = useState({ groups: 0, members: 0 });
  const [loadingCounts, setLoadingCounts] = useState(false);

  // New momo code state
  const [newMomoCode, setNewMomoCode] = useState('');
  const [addingMomo, setAddingMomo] = useState(false);

  useEffect(() => {
    setFormData({
      name: institution.name,
      status: institution.status,
      code: institution.code || '',
      supervisor: institution.supervisor || '',
      contact_email: institution.contact_email || '',
      contact_phone: institution.contact_phone || '',
      region: institution.region || ''
    });
    setIsEditing(false);
    setActiveTab('overview');
    setError(null);
    setSuccess(null);
  }, [institution.id]);

  // Load MoMo codes when tab active
  useEffect(() => {
    if (activeTab === 'momo' && isOpen) {
      loadMomoCodes();
    }
  }, [activeTab, isOpen, institution.id]);

  // Load staff when tab active
  useEffect(() => {
    if (activeTab === 'staff' && isOpen) {
      loadStaff();
    }
  }, [activeTab, isOpen, institution.id]);


  // Load counts when directory tab active
  useEffect(() => {
    if (activeTab === 'directory' && isOpen) {
      loadCounts();
    }
  }, [activeTab, isOpen, institution.id]);

  const loadMomoCodes = async () => {
    setLoadingMomo(true);
    try {
      const { data, error } = await supabase
        .from('institution_momo_codes')
        .select('*')
        .eq('institution_id', institution.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setMomoCodes(data || []);
    } catch (err) {
      console.error('Error loading momo codes:', err);
    } finally {
      setLoadingMomo(false);
    }
  };

  const loadStaff = async () => {
    setLoadingStaff(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, role, status, is_active, created_at')
        .eq('institution_id', institution.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };


  const loadCounts = async () => {
    setLoadingCounts(true);
    try {
      const [groupsRes, membersRes] = await Promise.all([
        supabase.from('groups').select('id', { count: 'exact', head: true }).eq('institution_id', institution.id),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('institution_id', institution.id)
      ]);

      setCounts({
        groups: groupsRes.count || 0,
        members: membersRes.count || 0
      });
    } catch (err) {
      console.error('Error loading counts:', err);
    } finally {
      setLoadingCounts(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.rpc('update_institution', {
        p_institution_id: institution.id,
        p_name: formData.name || null,
        p_status: formData.status || null,
        p_code: formData.code || null,
        p_supervisor: formData.supervisor || null,
        p_contact_email: formData.contact_email || null,
        p_contact_phone: formData.contact_phone || null,
        p_region: formData.region || null
      });

      if (error) throw error;

      setSuccess('Institution updated successfully');
      setIsEditing(false);
      onEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update institution');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (momoId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase.rpc('set_institution_momo_code', {
        p_institution_id: institution.id,
        p_momo_code: momoCodes.find(m => m.id === momoId)?.momo_code || '',
        p_is_primary: true
      });

      if (error) throw error;

      setSuccess('Primary MoMo code updated');
      loadMomoCodes();
      onEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary MoMo code');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMomoCode = async () => {
    if (!newMomoCode.trim()) return;

    setAddingMomo(true);
    setError(null);

    try {
      const { error } = await supabase.rpc('set_institution_momo_code', {
        p_institution_id: institution.id,
        p_momo_code: newMomoCode.trim(),
        p_is_primary: momoCodes.length === 0
      });

      if (error) throw error;

      setNewMomoCode('');
      setSuccess('MoMo code added');
      loadMomoCodes();
      onEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add MoMo code');
    } finally {
      setAddingMomo(false);
    }
  };

  const handleDeactivateStaff = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase.rpc('deactivate_staff', {
        p_user_id: userId
      });

      if (error) throw error;

      setSuccess('Staff member deactivated');
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate staff');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivateStaff = async (userId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase.rpc('reactivate_staff', {
        p_user_id: userId
      });

      if (error) throw error;

      setSuccess('Staff member reactivated');
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate staff');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'ADMIN') {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-slate-100 text-slate-600'; // STAFF and all others
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: Building },
    { id: 'momo' as TabId, label: 'MoMo Codes', icon: CreditCard },
    { id: 'staff' as TabId, label: 'Staff', icon: Users },
    { id: 'directory' as TabId, label: 'Directory', icon: Briefcase }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{institution.name}</h2>
              <span className="text-xs text-slate-500 font-mono">{institution.code || institution.id.slice(0, 8)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-3 rounded-lg">
            <Check size={16} />
            {success}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor</label>
                    <input
                      type="text"
                      value={formData.supervisor}
                      onChange={e => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={e => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={e => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Type</span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${institution.type === 'BANK' ? 'bg-blue-100 text-blue-700' :
                        institution.type === 'MFI' ? 'bg-purple-100 text-purple-700' :
                          'bg-teal-100 text-teal-700'
                      }`}>{institution.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Status</span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${institution.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        institution.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                      }`}>{institution.status}</span>
                  </div>
                  {institution.supervisor && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Supervisor</span>
                      <span className="text-sm text-slate-700">{institution.supervisor}</span>
                    </div>
                  )}
                  {institution.region && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Region</span>
                      <span className="text-sm text-slate-700">{institution.region}</span>
                    </div>
                  )}
                  {institution.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={14} className="text-slate-400" />
                      <a href={`mailto:${institution.contact_email}`} className="text-blue-600 hover:underline">
                        {institution.contact_email}
                      </a>
                    </div>
                  )}
                  {institution.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-slate-400" />
                      <a href={`tel:${institution.contact_phone}`} className="text-blue-600 hover:underline">
                        {institution.contact_phone}
                      </a>
                    </div>
                  )}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={12} />
                      Created {new Date(institution.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MoMo Codes Tab */}
          {activeTab === 'momo' && (
            <div className="space-y-4">
              {loadingMomo ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
              ) : (
                <>
                  {/* Add new MoMo code */}
                  {isPlatformAdmin && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMomoCode}
                        onChange={e => setNewMomoCode(e.target.value)}
                        placeholder="Enter MoMo code..."
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                      <button
                        onClick={handleAddMomoCode}
                        disabled={!newMomoCode.trim() || addingMomo}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {addingMomo ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                  )}

                  {momoCodes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <CreditCard className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm">No MoMo codes configured</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {momoCodes.map(code => (
                        <div
                          key={code.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${code.is_primary ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className={code.is_primary ? 'text-blue-600' : 'text-slate-400'} size={18} />
                            <div>
                              <span className="font-mono text-sm">{code.momo_code}</span>
                              {code.is_primary && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>
                          {isPlatformAdmin && !code.is_primary && (
                            <button
                              onClick={() => handleSetPrimary(code.id)}
                              disabled={saving}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Set Primary
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              {loadingStaff ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm">No staff members</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staff.map(member => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="text-slate-400" size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">
                            {member.full_name || 'No name'}
                          </p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                          {member.role.replace('INSTITUTION_', '')}
                        </span>
                        {isPlatformAdmin && (
                          member.is_active ? (
                            <button
                              onClick={() => handleDeactivateStaff(member.user_id)}
                              disabled={saving}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateStaff(member.user_id)}
                              disabled={saving}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              Reactivate
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Directory Tab */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              {loadingCounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="text-teal-600" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Groups</p>
                        <p className="text-xs text-slate-500">Savings groups in this institution</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{counts.groups}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Members</p>
                        <p className="text-xs text-slate-500">Registered members</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{counts.members}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Shield className="text-purple-600" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Staff</p>
                        <p className="text-xs text-slate-500">Staff members assigned</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{staff.length}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab === 'overview' && isPlatformAdmin && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Edit2 size={18} />
                Edit Institution
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

