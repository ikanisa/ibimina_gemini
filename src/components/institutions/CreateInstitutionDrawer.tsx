/**
 * CreateInstitutionDrawer.tsx - Create new institution drawer
 */
import React, { useState } from 'react';
import {
  X, Building, Save, AlertCircle, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InstitutionType } from '../../types';

interface CreateInstitutionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateInstitutionDrawer: React.FC<CreateInstitutionDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'SACCO' as InstitutionType,
    status: 'ACTIVE',
    code: '',
    supervisor: '',
    contact_email: '',
    contact_phone: '',
    region: '',
    momo_code: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Institution name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('create_institution', {
        p_name: formData.name.trim(),
        p_type: formData.type,
        p_status: formData.status,
        p_code: formData.code.trim() || null,
        p_supervisor: formData.supervisor.trim() || null,
        p_contact_email: formData.contact_email.trim() || null,
        p_contact_phone: formData.contact_phone.trim() || null,
        p_region: formData.region.trim() || null,
        p_momo_code: formData.momo_code.trim() || null
      });

      if (error) throw error;

      // Reset form
      setFormData({
        name: '',
        type: 'SACCO',
        status: 'ACTIVE',
        code: '',
        supervisor: '',
        contact_email: '',
        contact_phone: '',
        region: '',
        momo_code: ''
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create institution');
    } finally {
      setSaving(false);
    }
  };

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
              <h2 className="font-semibold text-slate-900">Create Institution</h2>
              <p className="text-xs text-slate-500">Add a new financial institution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter institution name"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as InstitutionType }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="BANK">Bank</option>
                  <option value="MFI">MFI</option>
                  <option value="SACCO">SACCO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Institution Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., SACCO-001"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Supervisor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor</label>
              <input
                type="text"
                value={formData.supervisor}
                onChange={e => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                placeholder="Supervisor name"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="e.g., Kigali"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={e => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contact@institution.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={e => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+250 xxx xxx xxx"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Primary MoMo Code */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary MoMo Code</label>
              <input
                type="text"
                value={formData.momo_code}
                onChange={e => setFormData(prev => ({ ...prev, momo_code: e.target.value }))}
                placeholder="e.g., *182*1*1*12345#"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                Setting a MoMo code allows SMS parsing for this institution
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || !formData.name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Create Institution
          </button>
        </div>
      </div>
    </div>
  );
};

