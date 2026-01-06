
import React, { useState, useMemo } from 'react';
import { Filter, MoreHorizontal, ShieldCheck, X, User, FileText, CreditCard, History, Briefcase, Edit, Lock, Ban, CheckCircle, Plus, Upload } from 'lucide-react';
import { Member, ViewState } from '../types';
import { MOCK_MEMBERS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useMembers } from '../hooks';
import { transformMembers } from '../lib/transformers/memberTransformer';
import { validateMemberData } from '../lib/validation';
import { Modal, LoadingSpinner, ErrorDisplay, EmptyState, Button, FormField, SearchInput, Badge } from './ui';
import BulkMemberUpload from './BulkMemberUpload';

interface MembersProps {
  members?: Member[];
  onNavigate?: (view: ViewState) => void;
}

type Tab = 'Profile' | 'Accounts' | 'Transactions' | 'Documents' | 'Tokens';

const Members: React.FC<MembersProps> = ({ members: membersProp, onNavigate }) => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  
  // Use the new hook instead of manual state management
  const {
    members: supabaseMembers,
    loading,
    error,
    createMember: createMemberApi,
    refetch
  } = useMembers({
    includeGroups: true,
    autoFetch: !useMockData && !membersProp
  });

  // Transform Supabase members to UI format
  const members = useMemo(() => {
    if (membersProp) return membersProp;
    if (useMockData) return MOCK_MEMBERS;
    if (!supabaseMembers.length) return [];
    
    // Transform using the transformer utility
    // Extract groups from the membersWithGroups structure
    // The fetchMembersWithGroups returns members with groups property as array of strings
    const groupsMap = new Map<string, string[]>();
    supabaseMembers.forEach((member: any) => {
      if (member.groups && Array.isArray(member.groups)) {
        // groups is already an array of strings from the API
        groupsMap.set(member.id, member.groups);
      }
    });
    
    return transformMembers(supabaseMembers, groupsMap);
  }, [membersProp, useMockData, supabaseMembers]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Profile');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newMemberData, setNewMemberData] = useState({
    full_name: '',
    phone: '',
    branch: 'HQ'
  });

  // Bulk Upload Modal State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Handle Add Member with validation
  const handleAddMember = async () => {
    if (!institutionId) {
      setFormErrors({ submit: 'No institution selected' });
      return;
    }

    // Validate using validation utility
    const validation = validateMemberData(newMemberData);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      await createMemberApi({
        institution_id: institutionId,
        full_name: newMemberData.full_name.trim(),
        phone: validation.normalized?.phone || newMemberData.phone,
        branch: newMemberData.branch || 'HQ'
      });

      // Reset form and close modal
      setNewMemberData({ full_name: '', phone: '', branch: 'HQ' });
      setIsAddModalOpen(false);
      // Hook automatically updates the members list
    } catch (err) {
      setFormErrors({ 
        submit: err instanceof Error ? err.message : 'Failed to add member' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter members
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const term = searchTerm.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.phone.includes(term)
    );
  }, [members, searchTerm]);

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 animate-in fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[calc(100vh-100px)] flex gap-6">
        {/* List Section */}
        <div className={`flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 ${selectedMember ? 'w-1/2 hidden lg:flex' : 'w-full'}`}>
          {/* Error Display */}
          {error && (
            <ErrorDisplay 
              error={error} 
              variant="banner"
            />
          )}
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="relative w-64">
              <SearchInput
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
                <Filter size={18} />
              </button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload size={16} />}
                onClick={() => setIsBulkUploadOpen(true)}
              >
                Bulk Upload
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add Member
              </Button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Member</div>
            <div className="col-span-3">Ibimina (Groups)</div>
            <div className="col-span-2 text-right">Savings</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Body */}
          <div className="overflow-y-auto flex-1">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => { setSelectedMember(member); setActiveTab('Profile'); }}
                className={`grid grid-cols-12 px-4 py-3 items-center border-b border-slate-50 cursor-pointer hover:bg-blue-50/50 active:bg-blue-100 transition-all duration-150 touch-manipulation min-h-[60px] ${selectedMember?.id === member.id ? 'bg-blue-50 ring-2 ring-blue-200' : ''}`}
              >
                <div className="col-span-4 flex items-center gap-3">
                  <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.phone}</p>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-slate-600">
                  {member.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {member.groups.slice(0, 2).map((group, idx) => (
                        <span key={idx} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-100 truncate max-w-[100px]">
                          {group}
                        </span>
                      ))}
                      {member.groups.length > 2 && (
                        <span className="text-[10px] text-slate-400">+{member.groups.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">No groups</span>
                  )}
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-slate-900">
                  {member.savingsBalance.toLocaleString()} RWF
                </div>
                <div className="col-span-2 flex justify-center">
                  <Badge
                    variant={member.status === 'Active' ? 'success' : member.status === 'Pending' ? 'warning' : 'danger'}
                  >
                    {member.status}
                  </Badge>
                </div>
                <div className="col-span-1 flex justify-end text-slate-400">
                  <MoreHorizontal size={16} />
                </div>
              </div>
            ))}
            {filteredMembers.length === 0 && (
              <EmptyState
                icon={User}
                title={useMockData ? 'No members found' : 'No members yet'}
                description={useMockData 
                  ? 'No members match your search.' 
                  : 'Add members to get started.'}
                action={
                  !useMockData && (
                    <Button
                      variant="primary"
                      leftIcon={<Plus size={16} />}
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      Add First Member
                    </Button>
                  )
                }
              />
            )}
          </div>
        </div>

        {/* Detail Drawer */}
        {selectedMember && (
          <div className="w-full lg:w-1/2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div className="flex items-center gap-3">
                <img src={selectedMember.avatarUrl} alt="" className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedMember.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{selectedMember.id}</span>
                    {selectedMember.kycStatus === 'Verified' && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <ShieldCheck size={12} /> KYC Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-5 overflow-x-auto">
              {[
                { id: 'Profile', icon: User },
                { id: 'Accounts', icon: CreditCard },
                { id: 'Transactions', icon: History },
                { id: 'Tokens', icon: ShieldCheck }, // Using ShieldCheck as placeholder for Tokens
                { id: 'Documents', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <tab.icon size={16} />
                  {tab.id}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">

              {activeTab === 'Profile' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Briefcase size={16} className="text-blue-600" /> Group Memberships (Ibimina)
                    </h3>
                    {selectedMember.groups.length > 0 ? (
                      <div className="space-y-2">
                        {selectedMember.groups.map((group, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">{group}</span>
                            <button
                              onClick={() => onNavigate && onNavigate(ViewState.GROUPS)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View Group
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Not a member of any active group.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                      <p className="text-sm font-medium text-slate-900">{selectedMember.phone}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Home Branch</p>
                      <p className="text-sm font-medium text-slate-900">{selectedMember.branch}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Actions</h3>
                    <div className="space-y-2">
                      <button className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm text-left hover:bg-slate-50 transition-colors text-slate-700 flex items-center gap-3">
                        <Edit size={16} /> Edit Info
                      </button>

                      {selectedMember.kycStatus !== 'Verified' && (
                        <button className="w-full bg-white border border-green-200 p-3 rounded-lg text-sm text-left hover:bg-green-50 transition-colors text-green-700 flex items-center gap-3">
                          <CheckCircle size={16} /> Mark as Verified
                        </button>
                      )}

                      <button className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm text-left hover:bg-slate-50 transition-colors text-slate-700 flex items-center gap-3">
                        <Lock size={16} /> Reset PIN / Password
                      </button>

                      <button className="w-full bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-left hover:bg-red-100 transition-colors text-red-600 flex items-center gap-3">
                        <Ban size={16} /> Suspend Member
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Accounts' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold text-slate-700">Main Savings</h4>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Active</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{selectedMember.savingsBalance.toLocaleString()} <span className="text-sm font-normal text-slate-500">RWF</span></p>
                    <p className="text-xs text-slate-500 mt-1">Last deposit: 2 days ago</p>
                  </div>

                  <div
                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => onNavigate && onNavigate(ViewState.LOANS)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold text-slate-700">Loan Account</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${selectedMember.loanBalance > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {selectedMember.loanBalance > 0 ? 'Active Loan' : 'No Active Loan'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{selectedMember.loanBalance.toLocaleString()} <span className="text-sm font-normal text-slate-500">RWF</span></p>
                    <p className="text-xs text-slate-500 mt-1">Next repayment due: 25 Oct 2023</p>
                  </div>
                </div>
              )}

              {/* Other tabs simplified for brevity */}
              {(activeTab === 'Transactions' || activeTab === 'Documents' || activeTab === 'Tokens') && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 animate-in fade-in duration-200">
                  <p className="text-sm">No recent items found.</p>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal - Using new Modal component */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormErrors({});
          setNewMemberData({ full_name: '', phone: '', branch: 'HQ' });
        }}
        title="Add New Member"
        size="md"
      >
        <div className="p-6 space-y-4">
          {formErrors.submit && (
            <ErrorDisplay error={formErrors.submit} variant="inline" />
          )}

          <FormField 
            label="Full Name" 
            required 
            error={formErrors.full_name}
          >
            <input
              type="text"
              value={newMemberData.full_name}
              onChange={(e) => setNewMemberData({ ...newMemberData, full_name: e.target.value })}
              placeholder="e.g., Jean Pierre Habimana"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField 
            label="Phone Number" 
            required 
            error={formErrors.phone}
            hint="Format: +250XXXXXXXXX"
          >
            <input
              type="tel"
              value={newMemberData.phone}
              onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
              placeholder="e.g., +250788123456"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField 
            label="Branch" 
            error={formErrors.branch}
          >
            <input
              type="text"
              value={newMemberData.branch}
              onChange={(e) => setNewMemberData({ ...newMemberData, branch: e.target.value })}
              placeholder="e.g., HQ, Kigali, Huye"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setIsAddModalOpen(false);
              setFormErrors({});
              setNewMemberData({ full_name: '', phone: '', branch: 'HQ' });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddMember}
            isLoading={isSubmitting}
            leftIcon={<Plus size={16} />}
          >
            Add Member
          </Button>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <BulkMemberUpload
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={() => {
            setIsBulkUploadOpen(false);
            // Hook will automatically refetch
            refetch();
          }}
        />
      )}
    </>
  );
};

export default Members;
