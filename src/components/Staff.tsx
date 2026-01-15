
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Plus,
  MoreHorizontal,
  Check,
  X,
  KeyRound,
  UserCog,
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Mail,
  Lock,
  Building,
  User,
  Loader2,
  Eye
} from 'lucide-react';
// Mock data removed - using only real Supabase data
import { StaffMember, StaffRole, SupabaseProfile } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { buildInitialsAvatar } from '../lib/avatars';
import { mapStaffRole, mapStaffStatus } from '../lib/mappers';
import { LoadingSpinner, ErrorDisplay, EmptyState, Button, FormField, SearchInput, Badge, Modal } from './ui';
import { useIsMobile } from '../hooks/useResponsive';

type Tab = 'Staff List' | 'Roles & Permissions';
type ImportStep = 'upload' | 'processing' | 'review' | 'success';

interface ParsedCandidate {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  branch: string;
  confidence: number; // 0-100 score from AI
}

interface StaffProps {
  currentUser: StaffMember;
  onImpersonate: (staff: StaffMember) => void;
}

const Staff: React.FC<StaffProps> = ({ currentUser, onImpersonate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Staff List');
  const { institutionId } = useAuth();
  const isMobile = useIsMobile();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Admin');

  // Add Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    role: 'Staff' as StaffRole,
    branch: '',
    status: 'Active' as 'Active' | 'Suspended',
    onboardingMethod: 'invite', // 'invite' | 'password'
    password: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Always load from Supabase

    const loadStaff = async () => {
      setLoading(true);
      setError(null);

      const query = supabase
        .from('profiles')
        .select('user_id, email, role, full_name, branch, avatar_url, status, last_login_at, institution_id');

      const { data, error } = institutionId
        ? await query.eq('institution_id', institutionId)
        : await query;

      if (error) {
        console.error('Error loading staff:', error);
        setError('Unable to load staff. Check your connection and permissions.');
        setStaffMembers([]);
        setLoading(false);
        return;
      }

      const mapped = (data as SupabaseProfile[]).map((staff) => {
        const name = staff.full_name || staff.email || 'Staff';
        return {
          id: staff.user_id,
          name,
          email: staff.email || 'unknown',
          role: mapStaffRole(staff.role),
          branch: staff.branch || 'HQ',
          status: mapStaffStatus(staff.status),
          lastLogin: staff.last_login_at ? new Date(staff.last_login_at).toLocaleString() : '—',
          avatarUrl: staff.avatar_url || buildInitialsAvatar(name)
        };
      });

      setStaffMembers(mapped);
      setLoading(false);
    };

    loadStaff();
  }, [institutionId]);

  // Filter staff with useMemo
  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staffMembers;
    const term = searchTerm.toLowerCase();
    return staffMembers.filter(staff =>
      staff.name.toLowerCase().includes(term) ||
      staff.email.toLowerCase().includes(term) ||
      staff.role.toLowerCase().includes(term)
    );
  }, [staffMembers, searchTerm]);

  // Mock permissions matrix data
  const features = ['Members', 'Savings', 'Loans', 'Reconciliation', 'Reports', 'Settings'];
  const permissions = ['View', 'Create', 'Edit', 'Approve', 'Delete'];

  // Mock permission state
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({
    'Members-View': true, 'Members-Create': true, 'Members-Edit': true,
    'Savings-View': true, 'Savings-Create': true,
    'Loans-View': true, 'Loans-Create': true, 'Loans-Approve': true,
  });

  const togglePermission = (feature: string, perm: string) => {
    const key = `${feature}-${perm}`;
    setRolePermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handlers for Add Staff Form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newStaffData.name.trim()) errors.name = "Full name is required";
    if (!newStaffData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaffData.email)) errors.email = "Invalid email format";

    if (!newStaffData.branch.trim()) errors.branch = "Branch assignment is required";

    if (newStaffData.onboardingMethod === 'password') {
      if (!newStaffData.password) errors.password = "Temporary password is required";
      else if (newStaffData.password.length < 8) errors.password = "Password must be at least 8 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Always use Supabase API - mock data removed

    const { data, error } = await supabase.functions.invoke('staff-invite', {
      body: {
        email: newStaffData.email,
        full_name: newStaffData.name,
        role: newStaffData.role,
        branch: newStaffData.branch,
        institution_id: institutionId,
        onboarding_method: newStaffData.onboardingMethod,
        password: newStaffData.onboardingMethod === 'password' ? newStaffData.password : undefined
      }
    });

    if (error) {
      console.error('Error creating staff:', error);
      setFormErrors({ submit: 'Unable to create staff. Ensure the staff-invite function is deployed.' });
      setIsSubmitting(false);
      return;
    }

    if (data?.profile) {
      const newProfile = data.profile as SupabaseProfile;
      const name = newProfile.full_name || newProfile.email || 'Staff';
      setStaffMembers((prev) => [
        {
          id: newProfile.user_id,
          name,
          email: newProfile.email || newStaffData.email,
          role: mapStaffRole(newProfile.role),
          branch: newProfile.branch || newStaffData.branch,
          status: mapStaffStatus(newProfile.status),
          lastLogin: newProfile.last_login_at ? new Date(newProfile.last_login_at).toLocaleString() : '—',
          avatarUrl: newProfile.avatar_url || buildInitialsAvatar(name)
        },
        ...prev
      ]);
    }

    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setNewStaffData({
      name: '',
      email: '',
      role: 'Staff',
      branch: '',
      status: 'Active',
      onboardingMethod: 'invite',
      password: ''
    });
  };

  // Handlers for Import Flow
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Start Simulation
    setImportStep('processing');
    setUploadProgress(10);
    setProcessingStatus('Uploading document...');

    setTimeout(() => {
      setUploadProgress(40);
      setProcessingStatus('AI analyzing document structure...');
    }, 800);

    setTimeout(() => {
      setUploadProgress(70);
      setProcessingStatus('Extracting staff entities and roles...');
    }, 2000);

    setTimeout(() => {
      setUploadProgress(100);
      setProcessingStatus('Finalizing data mapping...');

      setUploadProgress(100);
      setProcessingStatus('Finalizing data mapping...');

      // Real implementation would parse here
      setParsedCandidates([]);
      setImportStep('review');
    }, 3000);
  };

  const handleImportConfirm = () => {
    // In a real app, this would POST to the API
    setImportStep('success');
    setTimeout(() => {
      setIsImportModalOpen(false);
      setImportStep('upload');
    }, 2000);
  };

  const updateCandidate = (id: string, field: keyof ParsedCandidate, value: string) => {
    setParsedCandidates(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCandidate = (id: string) => {
    setParsedCandidates(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 relative">
      {/* Tab Switcher */}
      <div className="flex justify-between items-center">
        <div className="flex border-b border-slate-200">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'Staff List' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('Staff List')}
          >
            <Users size={16} />
            Staff List
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'Roles & Permissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('Roles & Permissions')}
          >
            <Shield size={16} />
            Roles & Permissions
          </button>
        </div>

        {activeTab === 'Staff List' && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles size={16} className="text-purple-600" />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Bulk Import via AI
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Staff
            </Button>
          </div>
        )}
      </div>

      {activeTab === 'Staff List' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Error Display */}
          {error && (
            <ErrorDisplay error={error} variant="banner" />
          )}
          {/* Loading State */}
          {loading && (
            <LoadingSpinner size="lg" text="Loading staff..." className="h-32" />
          )}
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="relative w-72">
              <SearchInput
                placeholder="Search staff by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>
          </div>

          {/* Staff Table */}
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Staff Member</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Branch</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50 active:bg-slate-100 transition-all duration-150 touch-manipulation">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={staff.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{staff.name}</p>
                        <p className="text-xs text-slate-500">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-slate-700 bg-slate-100 w-fit px-2 py-1 rounded">
                      {staff.role === 'Admin' && <KeyRound size={12} className="text-purple-600" />}
                      {staff.role === 'Staff' && <UserCog size={12} className="text-blue-600" />}
                      {staff.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{staff.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${staff.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{staff.lastLogin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end gap-2">
                    {currentUser.role === 'Admin' && staff.id !== currentUser.id && (
                      <button
                        onClick={() => onImpersonate(staff)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-1"
                        title={`View portal as ${staff.name}`}
                      >
                        <Eye size={14} /> View As
                      </button>
                    )}
                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStaff.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-sm">
              No staff found.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Roles & Permissions Content */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Configuring Permissions For:</label>
              <select
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 p-2.5"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
              >
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div className="flex-1"></div>
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2 max-w-md">
              <Shield size={16} className="shrink-0 mt-0.5" />
              <p>Permissions update immediately. Be careful when granting 'Delete' or 'Approve' rights to lower-level roles.</p>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700 w-1/4">Feature Access</th>
                  {permissions.map(perm => (
                    <th key={perm} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">{perm}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {features.map(feature => (
                  <tr key={feature} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{feature}</td>
                    {permissions.map(perm => {
                      const isChecked = rolePermissions[`${feature}-${perm}`];
                      const isDisabled = selectedRole === 'Admin';
                      const displayChecked = isDisabled ? true : isChecked;

                      return (
                        <td key={`${feature}-${perm}`} className="px-4 py-3 text-center">
                          <div
                            onClick={() => !isDisabled && togglePermission(feature, perm)}
                            className={`w-5 h-5 rounded border mx-auto flex items-center justify-center cursor-pointer transition-colors ${displayChecked
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-slate-300 hover:border-blue-400'
                              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {displayChecked && <Check size={12} className="text-white" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 mr-3">
              Reset to Default
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Plus className="bg-blue-100 text-blue-600 p-1 rounded-full w-6 h-6" />
                New Staff Member
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateStaff}>
              <div className="p-6 space-y-4">
                {/* Name & Email */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                        placeholder="e.g. John Mugisha"
                        value={newStaffData.name}
                        onChange={e => setNewStaffData({ ...newStaffData, name: e.target.value })}
                      />
                    </div>
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="email"
                        className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${formErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                        placeholder="john.m@saccoplus.rw"
                        value={newStaffData.email}
                        onChange={e => setNewStaffData({ ...newStaffData, email: e.target.value })}
                      />
                    </div>
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                </div>

                {/* Role & Branch */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Role <span className="text-red-500">*</span></label>
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStaffData.role}
                      onChange={e => setNewStaffData({ ...newStaffData, role: e.target.value as StaffRole })}
                    >
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Branch <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.branch ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                        placeholder="Assign Branch"
                        value={newStaffData.branch}
                        onChange={e => setNewStaffData({ ...newStaffData, branch: e.target.value })}
                      />
                    </div>
                    {formErrors.branch && <p className="text-red-500 text-xs mt-1">{formErrors.branch}</p>}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Initial Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={newStaffData.status === 'Active'}
                        onChange={() => setNewStaffData({ ...newStaffData, status: 'Active' })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={newStaffData.status === 'Suspended'}
                        onChange={() => setNewStaffData({ ...newStaffData, status: 'Suspended' })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Suspended</span>
                    </label>
                  </div>
                </div>

                {/* Onboarding */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-3">Onboarding Method</label>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setNewStaffData({ ...newStaffData, onboardingMethod: 'invite' })}
                      className={`p-3 border rounded-lg text-left transition-all ${newStaffData.onboardingMethod === 'invite'
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-1">
                        <Mail size={16} /> Send Invitation
                      </div>
                      <p className="text-xs text-slate-500">Email link to set password</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewStaffData({ ...newStaffData, onboardingMethod: 'password' })}
                      className={`p-3 border rounded-lg text-left transition-all ${newStaffData.onboardingMethod === 'password'
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-1">
                        <Lock size={16} /> Set Password
                      </div>
                      <p className="text-xs text-slate-500">Manually create password</p>
                    </button>
                  </div>

                  {newStaffData.onboardingMethod === 'password' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Temporary Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="password"
                          className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                          placeholder="Enter temporary password"
                          value={newStaffData.password}
                          onChange={e => setNewStaffData({ ...newStaffData, password: e.target.value })}
                        />
                      </div>
                      {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                    </div>
                  )}
                </div>

              </div>
              {formErrors.submit && (
                <div className="px-6 pb-2 text-sm text-red-600">
                  {formErrors.submit}
                </div>
              )}

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    <>Create Staff Member</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Import Modal (Existing Code) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">AI Staff Import</h3>
                  <p className="text-xs text-slate-500">Upload PDF, Excel, or Image rosters</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              {importStep === 'upload' && (
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-10 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer h-64"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.csv,.xlsx,.png,.jpg"
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-blue-600">
                    <Upload size={32} />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-1">Click to upload or drag and drop</h4>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Support for PDF staff lists, Excel rosters, or scanned images of employee forms.
                  </p>
                  <div className="flex gap-2 mt-6">
                    <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded flex items-center gap-1"><FileText size={12} /> PDF</span>
                    <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded flex items-center gap-1"><FileSpreadsheet size={12} /> Excel</span>
                  </div>
                </div>
              )}

              {importStep === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={32} className="text-purple-500 animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Processing Document</h4>
                  <p className="text-slate-500 text-sm mb-8">{processingStatus}</p>

                  <div className="w-full max-w-md bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {importStep === 'review' && (
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-800">Review Extracted Data</h4>
                      <p className="text-xs text-slate-500">The AI found {parsedCandidates.length} potential staff members. Please verify details.</p>
                    </div>
                    <div className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                      <Check size={12} /> AI Confidence High
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                          <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                          <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                          <th className="px-4 py-3 font-medium text-slate-500">Branch</th>
                          <th className="px-4 py-3 font-medium text-slate-500 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedCandidates.map((candidate) => (
                          <tr key={candidate.id} className="group hover:bg-blue-50/30">
                            <td className="p-2">
                              <input
                                type="text"
                                value={candidate.name}
                                onChange={(e) => updateCandidate(candidate.id, 'name', e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={candidate.email}
                                onChange={(e) => updateCandidate(candidate.id, 'email', e.target.value)}
                                className={`w-full bg-transparent border border-transparent hover:border-slate-300 rounded px-2 py-1 outline-none ${!candidate.email.includes('@') ? 'text-red-600 bg-red-50' : ''
                                  }`}
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={candidate.role}
                                onChange={(e) => updateCandidate(candidate.id, 'role', e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1 py-1 outline-none text-sm"
                              >
                                <option>Staff</option>
                                <option>Admin</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={candidate.branch}
                                onChange={(e) => updateCandidate(candidate.id, 'branch', e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removeCandidate(candidate.id)}
                                className="text-slate-300 hover:text-red-500"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <AlertCircle size={14} className="text-amber-500" />
                    <span>Rows highlighted in red may contain errors.</span>
                  </div>
                </div>
              )}

              {importStep === 'success' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <Check size={40} />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800">Import Successful</h4>
                  <p className="text-slate-500 mt-2">3 new staff members have been added to the system pending final activation.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {importStep === 'review' && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                  onClick={() => setImportStep('upload')}
                  className="text-slate-500 text-sm font-medium hover:text-slate-700"
                >
                  Back to Upload
                </button>
                <button
                  onClick={handleImportConfirm}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Import {parsedCandidates.length} Staff Members
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
