
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Smartphone, ShieldCheck, UserCheck, X, User, FileText, CreditCard, History, Briefcase, Edit, Lock, Ban, CheckCircle, Plus } from 'lucide-react';
import { Member, ViewState, SupabaseGroup, SupabaseGroupMember, SupabaseMember } from '../types';
import { MOCK_MEMBERS } from '../constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mapKycStatus, mapMemberStatus } from '../lib/mappers';
import { buildInitialsAvatar } from '../lib/avatars';

interface MembersProps {
  members?: Member[];
  onNavigate?: (view: ViewState) => void;
}

type Tab = 'Profile' | 'Accounts' | 'Transactions' | 'Documents' | 'Tokens';

const Members: React.FC<MembersProps> = ({ members: membersProp, onNavigate }) => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  const [members, setMembers] = useState<Member[]>(membersProp ?? (useMockData ? MOCK_MEMBERS : []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Profile');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newMemberData, setNewMemberData] = useState({
    full_name: '',
    phone: '',
    branch: 'HQ'
  });

  // Handle Add Member
  const handleAddMember = async () => {
    if (!institutionId) {
      setAddError('No institution selected');
      return;
    }
    if (!newMemberData.full_name.trim()) {
      setAddError('Full name is required');
      return;
    }
    if (!newMemberData.phone.trim()) {
      setAddError('Phone number is required');
      return;
    }

    setIsSubmitting(true);
    setAddError(null);

    const { data, error } = await supabase
      .from('members')
      .insert({
        institution_id: institutionId,
        full_name: newMemberData.full_name.trim(),
        phone: newMemberData.phone.trim(),
        branch: newMemberData.branch || 'HQ',
        status: 'ACTIVE',
        kyc_status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding member:', error);
      setAddError('Failed to add member. Please try again.');
      setIsSubmitting(false);
      return;
    }

    // Add the new member to the list
    const newMember: Member = {
      id: data.id,
      name: data.full_name,
      phone: data.phone,
      branch: data.branch || 'HQ',
      status: mapMemberStatus(data.status),
      kycStatus: mapKycStatus(data.kyc_status ?? null),
      savingsBalance: 0,
      loanBalance: 0,
      tokenBalance: 0,
      joinDate: new Date().toISOString().split('T')[0],
      avatarUrl: buildInitialsAvatar(data.full_name),
      groups: []
    };
    setMembers(prev => [newMember, ...prev]);

    // Reset form and close modal
    setNewMemberData({ full_name: '', phone: '', branch: 'HQ' });
    setIsAddModalOpen(false);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (membersProp !== undefined) {
      setMembers(membersProp);
      return;
    }
    if (useMockData) {
      setMembers(MOCK_MEMBERS);
      return;
    }
    if (!institutionId) {
      setMembers([]);
      return;
    }

    const loadMembers = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading members:', error);
        setError('Unable to load members. Check your connection and permissions.');
        setMembers([]);
        setLoading(false);
        return;
      }

      const { data: groupData, error: groupError } = await supabase
        .from('group_members')
        .select('member_id, groups(group_name)')
        .eq('institution_id', institutionId);

      if (groupError) {
        console.error('Error loading member groups:', groupError);
      }

      type GroupMembershipRow = {
        member_id: string;
        groups?: { group_name?: string | null }[] | { group_name?: string | null } | null;
      };

      const groupsByMember = new Map<string, string[]>();
      (groupData as GroupMembershipRow[] | null)?.forEach((row) => {
        const groupName = Array.isArray(row.groups)
          ? row.groups[0]?.group_name
          : row.groups?.group_name;
        if (!groupName) return;
        const current = groupsByMember.get(row.member_id) ?? [];
        current.push(groupName);
        groupsByMember.set(row.member_id, current);
      });

      const mappedMembers = (data as SupabaseMember[]).map((member) => {
        const groupList = groupsByMember.get(member.id) ?? [];
        return {
          id: member.id,
          name: member.full_name,
          phone: member.phone,
          branch: member.branch || 'HQ',
          status: mapMemberStatus(member.status),
          kycStatus: mapKycStatus(member.kyc_status ?? null),
          savingsBalance: member.savings_balance ?? 0,
          loanBalance: member.loan_balance ?? 0,
          tokenBalance: member.token_balance ?? 0,
          joinDate: member.join_date ?? member.created_at.split('T')[0],
          avatarUrl: member.avatar_url || buildInitialsAvatar(member.full_name),
          groups: groupList
        };
      });

      setMembers(mappedMembers);
      setLoading(false);
    };

    loadMembers();
  }, [membersProp, useMockData, institutionId]);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[calc(100vh-100px)] flex gap-6">
        {/* List Section */}
        <div className={`flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${selectedMember ? 'w-1/2 hidden lg:flex' : 'w-full'}`}>
          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search members..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
                <Filter size={18} />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={16} /> Add Member
              </button>
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
                className={`grid grid-cols-12 px-4 py-3 items-center border-b border-slate-50 cursor-pointer hover:bg-blue-50/50 transition-colors ${selectedMember?.id === member.id ? 'bg-blue-50' : ''}`}
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
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${member.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                    member.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {member.status}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end text-slate-400">
                  <MoreHorizontal size={16} />
                </div>
              </div>
            ))}
            {filteredMembers.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                {useMockData ? 'No members found.' : 'No members yet. Add members to get started.'}
              </div>
            )}
          </div>
        </div>

        {/* Detail Drawer */}
        {selectedMember && (
          <div className="w-full lg:w-1/2 bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">
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

      {/* Add Member Modal */}
      {
        isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Add New Member</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {addError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {addError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newMemberData.full_name}
                    onChange={(e) => setNewMemberData({ ...newMemberData, full_name: e.target.value })}
                    placeholder="e.g., Jean Pierre Habimana"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={newMemberData.phone}
                    onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                    placeholder="e.g., +250788123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={newMemberData.branch}
                    onChange={(e) => setNewMemberData({ ...newMemberData, branch: e.target.value })}
                    placeholder="e.g., HQ, Kigali, Huye"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Add Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default Members;
