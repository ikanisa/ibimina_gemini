import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Mail, Phone, Shield, Building, Trash2, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { DrawerForm } from '../DrawerForm';
import { HealthBanner } from '../HealthBanner';
import { InstitutionSemanticSearch } from '@/shared/components/ui';

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  institution_id: string | null;
  is_active: boolean;
  created_at: string;
}


export const StaffSettings: React.FC = () => {
  const { institutionId, role: currentUserRole } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isPlatformAdmin = currentUserRole === 'Admin' || currentUserRole?.toUpperCase() === 'ADMIN';

  // Form state
  const [newStaff, setNewStaff] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'staff',
    institution_id: institutionId || ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    // Load staff
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by institution unless platform admin
    if (!isPlatformAdmin && institutionId) {
      query = query.eq('institution_id', institutionId);
    }

    const { data: staffData } = await query;

    if (staffData) {
      setStaff(staffData);
    }

    setLoading(false);
  }, [institutionId, isPlatformAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInviteStaff = async () => {
    if (!newStaff.email.trim() || !newStaff.role) {
      alert('Email and role are required');
      return;
    }

    if (!newStaff.institution_id && newStaff.role !== 'admin') {
      alert('Institution is required for non-admin roles');
      return;
    }

    setIsSaving(true);

    // Call the staff invite edge function
    const { data, error } = await supabase.functions.invoke('staff-invite', {
      body: {
        email: newStaff.email.trim(),
        full_name: newStaff.full_name.trim() || null,
        phone: newStaff.phone.trim() || null,
        role: newStaff.role,
        institution_id: newStaff.institution_id || null
      }
    });

    if (error) {
      console.error('Error inviting staff:', error);
      alert('Failed to invite staff member. Please try again.');
    } else {
      await loadData();
      setNewStaff({
        email: '',
        full_name: '',
        phone: '',
        role: 'staff',
        institution_id: institutionId || ''
      });
      setShowDrawer(false);
    }

    setIsSaving(false);
  };

  const handleDeactivate = async (staffId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', staffId);

    if (error) {
      console.error('Error deactivating staff:', error);
      alert('Failed to deactivate staff member. Please try again.');
    } else {
      await loadData();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'super admin':
        return 'bg-purple-100 text-purple-700';
      case 'branch manager':
      case 'manager':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const activeStaff = staff.filter(s => s.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage staff members and their access</p>
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Invite Staff
        </button>
      </div>

      {activeStaff.length === 0 && (
        <HealthBanner
          issues={[{
            type: 'info',
            message: 'No staff members yet',
            action: 'Invite team members to help manage this institution'
          }]}
        />
      )}

      {/* Staff List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {activeStaff.map(member => (
            <div key={member.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {member.full_name || 'Unnamed User'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <Mail size={14} />
                      {member.email}
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-500">
                        <Phone size={14} />
                        {member.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </span>
                  <button
                    onClick={() => handleDeactivate(member.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {activeStaff.length === 0 && (
            <div className="text-center py-12">
              <UserCheck size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Staff Members</h3>
              <p className="text-sm text-slate-500 mb-4">
                Invite team members to help manage the institution.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Staff Drawer */}
      <DrawerForm
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setNewStaff({
            email: '',
            full_name: '',
            phone: '',
            role: 'staff',
            institution_id: institutionId || ''
          });
        }}
        title="Invite Staff Member"
        description="Send an invitation to join this institution"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDrawer(false)}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleInviteStaff}
              disabled={isSaving || !newStaff.email.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="staff@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={newStaff.full_name}
              onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={newStaff.phone}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="+250 7XX XXX XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={newStaff.role}
              onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              {isPlatformAdmin && <option value="admin">Admin</option>}
            </select>
          </div>

          {isPlatformAdmin && (
            <InstitutionSemanticSearch
              label="Institution"
              required
              value={newStaff.institution_id}
              onChange={(id, _name) => setNewStaff({ ...newStaff, institution_id: id })}
              placeholder="Search for institution..."
            />
          )}
        </div>
      </DrawerForm>
    </div>
  );
};

export default StaffSettings;


