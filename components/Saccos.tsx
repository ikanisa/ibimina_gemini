/**
 * Saccos.tsx - Robust Institutions Management Page
 * 
 * Features:
 * - Server-side pagination for 500+ institutions
 * - Full CRUD operations (Add/Edit/View)
 * - Real-time search with debounce
 * - Branch management in detail drawer
 * - Navigation to related entities (Staff, Members, Groups)
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
   Building, MapPin, Users, ArrowRight, X, Settings, CreditCard,
   Search, Filter, Plus, ChevronLeft, ChevronRight, Download, Edit,
   AlertCircle, RefreshCw, Save, UserPlus, Briefcase
} from 'lucide-react';
import { Sacco, SupabaseBranch, SupabaseMember, ViewState, Institution, InstitutionType } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mapMemberStatus } from '../lib/mappers';

interface SaccosProps {
   onNavigate?: (view: ViewState) => void;
}

const ITEMS_PER_PAGE = 20;

const Saccos: React.FC<SaccosProps> = ({ onNavigate }) => {
   const { institutionId } = useAuth();

   // Data state
   const [saccos, setSaccos] = useState<Sacco[]>([]);
   const [totalCount, setTotalCount] = useState(0);
   const [branchesByInstitution, setBranchesByInstitution] = useState<Record<string, SupabaseBranch[]>>({});

   // UI state
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [selectedSacco, setSelectedSacco] = useState<Sacco | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [debouncedSearch, setDebouncedSearch] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [typeFilter, setTypeFilter] = useState<InstitutionType | 'ALL'>('ALL');

   // Modal state
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [formData, setFormData] = useState({
      name: '',
      type: 'SACCO' as InstitutionType,
      code: '',
      supervisor: '',
      status: 'ACTIVE'
   });
   const [saving, setSaving] = useState(false);

   // Debounce search
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearch(searchTerm);
         setCurrentPage(1); // Reset to first page on search
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   // Load institutions with server-side pagination
   const loadInstitutions = useCallback(async () => {
      setLoading(true);
      setError(null);

      console.log('[Saccos] Loading institutions...', {
         supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
         hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
         currentPage,
         typeFilter,
         debouncedSearch
      });

      try {
         const offset = (currentPage - 1) * ITEMS_PER_PAGE;

         // Build query with filters
         let query = supabase
            .from('institutions')
            .select('*', { count: 'exact' })
            .order('name', { ascending: true })
            .range(offset, offset + ITEMS_PER_PAGE - 1);

         // Apply search filter
         if (debouncedSearch) {
            query = query.or(`name.ilike.%${debouncedSearch}%,code.ilike.%${debouncedSearch}%,supervisor.ilike.%${debouncedSearch}%`);
         }

         // Apply type filter
         if (typeFilter !== 'ALL') {
            query = query.eq('type', typeFilter);
         }

         const { data, error: fetchError, count } = await query;

         console.log('[Saccos] Query result:', { dataCount: data?.length, totalCount: count, error: fetchError });

         if (fetchError) {
            console.error('Error loading institutions:', fetchError);
            setError(`Unable to load institutions: ${fetchError.message}`);
            setSaccos([]);
            setTotalCount(0);
            return;
         }


         const institutions = (data as Institution[]) || [];
         setTotalCount(count ?? 0);

         if (institutions.length === 0) {
            setSaccos([]);
            setBranchesByInstitution({});
            return;
         }

         const institutionIds = institutions.map(inst => inst.id);

         // Fetch branches and member counts in parallel
         const [{ data: branchesData }, { data: membersData }] = await Promise.all([
            supabase.from('branches').select('*').in('institution_id', institutionIds),
            supabase.from('members').select('id, institution_id').in('institution_id', institutionIds)
         ]);

         // Build branch map
         const branchMap: Record<string, SupabaseBranch[]> = {};
         (branchesData as SupabaseBranch[] | null)?.forEach(branch => {
            if (!branchMap[branch.institution_id]) branchMap[branch.institution_id] = [];
            branchMap[branch.institution_id].push(branch);
         });

         // Build member count map
         const memberCountMap = (membersData as SupabaseMember[] | null)?.reduce((acc, member) => {
            acc[member.institution_id] = (acc[member.institution_id] ?? 0) + 1;
            return acc;
         }, {} as Record<string, number>) ?? {};

         // Map to UI format
         const mapped: Sacco[] = institutions.map(inst => ({
            id: inst.id,
            name: inst.name,
            code: inst.code ?? inst.id.slice(0, 6).toUpperCase(),
            status: mapMemberStatus(inst.status),
            branchesCount: branchMap[inst.id]?.length ?? 0,
            membersCount: memberCountMap[inst.id] ?? 0,
            totalAssets: inst.total_assets ?? 0,
            supervisor: inst.supervisor ?? '—',
            type: inst.type
         }));

         setBranchesByInstitution(branchMap);
         setSaccos(mapped);
      } catch (err) {
         console.error('Unexpected error:', err);
         setError('An unexpected error occurred while loading institutions.');
         setSaccos([]);
      } finally {
         setLoading(false);
      }
   }, [currentPage, debouncedSearch, typeFilter]);

   useEffect(() => {
      loadInstitutions();
   }, [loadInstitutions]);

   // Pagination calculations
   const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
   const startRecord = (currentPage - 1) * ITEMS_PER_PAGE + 1;
   const endRecord = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

   // Create institution
   const handleCreate = async () => {
      if (!formData.name.trim()) {
         setError('Institution name is required');
         return;
      }

      setSaving(true);
      setError(null);

      try {
         const { data, error: createError } = await supabase
            .from('institutions')
            .insert({
               name: formData.name.trim(),
               type: formData.type,
               code: formData.code.trim() || null,
               supervisor: formData.supervisor.trim() || null,
               status: formData.status
            })
            .select()
            .single();

         if (createError) {
            setError(`Failed to create institution: ${createError.message}`);
            return;
         }

         setIsAddModalOpen(false);
         setFormData({ name: '', type: 'SACCO', code: '', supervisor: '', status: 'ACTIVE' });
         loadInstitutions();
      } catch (err) {
         setError('An unexpected error occurred');
      } finally {
         setSaving(false);
      }
   };

   // Update institution
   const handleUpdate = async () => {
      if (!selectedSacco || !formData.name.trim()) {
         setError('Institution name is required');
         return;
      }

      setSaving(true);
      setError(null);

      try {
         const { error: updateError } = await supabase
            .from('institutions')
            .update({
               name: formData.name.trim(),
               type: formData.type,
               code: formData.code.trim() || null,
               supervisor: formData.supervisor.trim() || null,
               status: formData.status
            })
            .eq('id', selectedSacco.id);

         if (updateError) {
            setError(`Failed to update institution: ${updateError.message}`);
            return;
         }

         setIsEditModalOpen(false);
         setSelectedSacco(null);
         loadInstitutions();
      } catch (err) {
         setError('An unexpected error occurred');
      } finally {
         setSaving(false);
      }
   };

   // Open edit modal with pre-filled data
   const openEditModal = (sacco: Sacco) => {
      setFormData({
         name: sacco.name,
         type: (sacco as any).type || 'SACCO',
         code: sacco.code,
         supervisor: sacco.supervisor !== '—' ? sacco.supervisor : '',
         status: sacco.status === 'Active' ? 'ACTIVE' : sacco.status === 'Pending' ? 'PENDING' : 'INACTIVE'
      });
      setIsEditModalOpen(true);
   };

   // Export to CSV
   const handleExport = async () => {
      try {
         const { data } = await supabase
            .from('institutions')
            .select('id, name, code, type, status, supervisor, total_assets, created_at')
            .order('name');

         if (!data) return;

         const csv = [
            ['ID', 'Name', 'Code', 'Type', 'Status', 'Supervisor', 'Total Assets', 'Created At'].join(','),
            ...data.map(row => [
               row.id,
               `"${row.name}"`,
               row.code || '',
               row.type,
               row.status,
               row.supervisor || '',
               row.total_assets || 0,
               row.created_at
            ].join(','))
         ].join('\n');

         const blob = new Blob([csv], { type: 'text/csv' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `institutions_${new Date().toISOString().split('T')[0]}.csv`;
         a.click();
         URL.revokeObjectURL(url);
      } catch (err) {
         console.error('Export error:', err);
      }
   };

   return (
      <div className="relative h-full flex flex-col">
         <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedSacco ? 'md:w-1/2 md:pr-4' : 'w-full'}`}>

            {/* Error Banner */}
            {error && (
               <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <AlertCircle size={16} />
                     {error}
                  </div>
                  <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                     <X size={16} />
                  </button>
               </div>
            )}

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Search and Filters */}
                  <div className="flex items-center gap-3 w-full lg:w-auto">
                     <div className="relative flex-1 lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                           type="text"
                           placeholder="Search by name, code, or supervisor..."
                           className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <select
                        value={typeFilter}
                        onChange={e => { setTypeFilter(e.target.value as InstitutionType | 'ALL'); setCurrentPage(1); }}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                        <option value="ALL">All Types</option>
                        <option value="SACCO">SACCOs</option>
                        <option value="MFI">MFIs</option>
                        <option value="BANK">Banks</option>
                     </select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 w-full lg:w-auto">
                     <button
                        onClick={loadInstitutions}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                        disabled={loading}
                     >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                     </button>
                     <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                     >
                        <Download size={16} /> Export
                     </button>
                     <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                     >
                        <Plus size={16} /> Add Institution
                     </button>
                  </div>
               </div>

               {/* Stats Bar */}
               <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
                  <span><strong className="text-slate-700">{totalCount.toLocaleString()}</strong> total institutions</span>
                  {debouncedSearch && <span>filtered by "<strong>{debouncedSearch}</strong>"</span>}
               </div>
            </div>

            {/* Loading State */}
            {loading && (
               <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-3 text-slate-500">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                     <span className="text-sm">Loading institutions...</span>
                  </div>
               </div>
            )}

            {/* Data Table */}
            {!loading && (
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                  <div className="overflow-x-auto flex-1">
                     <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                           <tr>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Institution</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supervisor</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Branches</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Members</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Assets (RWF)</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                              <th className="px-4 py-3 w-10"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {saccos.map(sacco => (
                              <tr
                                 key={sacco.id}
                                 onClick={() => setSelectedSacco(sacco)}
                                 className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${selectedSacco?.id === sacco.id ? 'bg-blue-50' : ''}`}
                              >
                                 <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                       <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                          {sacco.name.substring(0, 2).toUpperCase()}
                                       </div>
                                       <div>
                                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{sacco.name}</p>
                                          <p className="text-xs text-slate-500 font-mono">{sacco.code}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${(sacco as any).type === 'BANK' ? 'bg-purple-50 text-purple-700' :
                                       (sacco as any).type === 'MFI' ? 'bg-orange-50 text-orange-700' :
                                          'bg-blue-50 text-blue-700'
                                       }`}>
                                       {(sacco as any).type || 'SACCO'}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 text-sm text-slate-600 max-w-[150px] truncate">{sacco.supervisor}</td>
                                 <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                       {sacco.branchesCount}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 text-right text-sm font-mono text-slate-600">
                                    {sacco.membersCount.toLocaleString()}
                                 </td>
                                 <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                    {sacco.totalAssets.toLocaleString()}
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sacco.status === 'Active' ? 'bg-green-50 text-green-700' :
                                       sacco.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                                          'bg-red-50 text-red-700'
                                       }`}>
                                       {sacco.status}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 text-slate-400">
                                    <ChevronRight size={16} />
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>

                     {saccos.length === 0 && !loading && (
                        <div className="p-12 text-center">
                           <Building className="mx-auto text-slate-300 mb-3" size={48} />
                           <p className="text-slate-500 text-sm">
                              {debouncedSearch ? `No institutions found matching "${debouncedSearch}"` : 'No institutions found.'}
                           </p>
                           {!debouncedSearch && (
                              <button
                                 onClick={() => setIsAddModalOpen(true)}
                                 className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                              >
                                 Add your first institution
                              </button>
                           )}
                        </div>
                     )}
                  </div>

                  {/* Pagination Footer */}
                  {totalCount > 0 && (
                     <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <span className="text-xs text-slate-500">
                           Showing {startRecord.toLocaleString()}-{endRecord.toLocaleString()} of {totalCount.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1">
                           <button
                              onClick={() => setCurrentPage(1)}
                              disabled={currentPage === 1}
                              className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              First
                           </button>
                           <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <ChevronLeft size={16} className="text-slate-600" />
                           </button>
                           <span className="px-3 text-xs font-medium text-slate-700">
                              Page {currentPage} of {totalPages}
                           </span>
                           <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage >= totalPages}
                              className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <ChevronRight size={16} className="text-slate-600" />
                           </button>
                           <button
                              onClick={() => setCurrentPage(totalPages)}
                              disabled={currentPage >= totalPages}
                              className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              Last
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            )}
         </div>

         {/* Detail Drawer */}
         {selectedSacco && (
            <div className="fixed md:absolute top-0 right-0 w-full md:w-1/2 h-full bg-white md:rounded-l-xl shadow-2xl border-l border-slate-200 flex flex-col z-30">
               <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                  <div>
                     <h2 className="text-lg md:text-xl font-bold text-slate-900">{selectedSacco.name}</h2>
                     <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{selectedSacco.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${selectedSacco.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                           selectedSacco.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                              'bg-red-50 text-red-700 border-red-100'
                           }`}>{selectedSacco.status}</span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => openEditModal(selectedSacco)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        title="Edit"
                     >
                        <Edit size={18} />
                     </button>
                     <button
                        onClick={() => setSelectedSacco(null)}
                        className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200"
                     >
                        <X size={20} />
                     </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                        <p className="text-xs font-bold text-blue-600 uppercase">Total Assets</p>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
                           {selectedSacco.totalAssets.toLocaleString()} <span className="text-xs font-normal text-slate-500">RWF</span>
                        </p>
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-xs font-bold text-slate-500 uppercase">Members</p>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{selectedSacco.membersCount.toLocaleString()}</p>
                     </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                     <button
                        onClick={() => onNavigate?.(ViewState.MEMBERS)}
                        className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                     >
                        <Users className="text-blue-600 mb-1" size={20} />
                        <p className="text-sm font-medium text-slate-900">View Members</p>
                        <p className="text-xs text-slate-500">{selectedSacco.membersCount} registered</p>
                     </button>
                     <button
                        onClick={() => onNavigate?.(ViewState.GROUPS)}
                        className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                     >
                        <Briefcase className="text-green-600 mb-1" size={20} />
                        <p className="text-sm font-medium text-slate-900">View Groups</p>
                        <p className="text-xs text-slate-500">Savings groups</p>
                     </button>
                  </div>

                  {/* Branch List */}
                  <div>
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-800">Branches ({selectedSacco.branchesCount})</h3>
                        <button className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
                           <Plus size={12} /> Add Branch
                        </button>
                     </div>
                     <div className="space-y-2">
                        {(branchesByInstitution[selectedSacco.id] ?? []).map((branch, idx) => (
                           <div key={branch.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-slate-50 cursor-pointer group">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    {String(idx + 1).padStart(2, '0')}
                                 </div>
                                 <div>
                                    <p className="font-medium text-sm text-slate-900">{branch.name}</p>
                                    <p className="text-xs text-slate-500">
                                       {branch.manager_name || 'No manager'} {branch.manager_phone && `• ${branch.manager_phone}`}
                                    </p>
                                 </div>
                              </div>
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                 {branch.status}
                              </span>
                           </div>
                        ))}
                        {(branchesByInstitution[selectedSacco.id] ?? []).length === 0 && (
                           <div className="p-6 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                              No branches found. Click "Add Branch" to create one.
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Configuration */}
                  <div className="pt-4 border-t border-slate-100">
                     <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Settings size={16} /> Configuration
                     </h3>
                     <div className="space-y-2">
                        <button
                           onClick={() => onNavigate?.(ViewState.STAFF)}
                           className="w-full text-left p-3 text-sm text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between group"
                        >
                           <div className="flex items-center gap-3">
                              <UserPlus size={18} className="text-slate-400 group-hover:text-blue-600" />
                              <span>Staff Assignments</span>
                           </div>
                           <ArrowRight size={14} className="text-slate-300" />
                        </button>
                        <button
                           onClick={() => onNavigate?.(ViewState.SETTINGS)}
                           className="w-full text-left p-3 text-sm text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between group"
                        >
                           <div className="flex items-center gap-3">
                              <CreditCard size={18} className="text-slate-400 group-hover:text-blue-600" />
                              <span>Institution Settings</span>
                           </div>
                           <ArrowRight size={14} className="text-slate-300" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Add/Edit Modal */}
         {(isAddModalOpen || isEditModalOpen) && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                     <h2 className="text-lg font-bold text-slate-900">
                        {isAddModalOpen ? 'Add New Institution' : 'Edit Institution'}
                     </h2>
                     <button
                        onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                        className="text-slate-400 hover:text-slate-600 p-1"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-4 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Institution Name *</label>
                        <input
                           type="text"
                           value={formData.name}
                           onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="e.g. Umurenge SACCO"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                           <select
                              value={formData.type}
                              onChange={e => setFormData(f => ({ ...f, type: e.target.value as InstitutionType }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           >
                              <option value="SACCO">SACCO</option>
                              <option value="MFI">MFI</option>
                              <option value="BANK">Bank</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                           <select
                              value={formData.status}
                              onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           >
                              <option value="ACTIVE">Active</option>
                              <option value="PENDING">Pending</option>
                              <option value="INACTIVE">Inactive</option>
                           </select>
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                        <input
                           type="text"
                           value={formData.code}
                           onChange={e => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                           placeholder="e.g. USACCO-001"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor</label>
                        <input
                           type="text"
                           value={formData.supervisor}
                           onChange={e => setFormData(f => ({ ...f, supervisor: e.target.value }))}
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Supervising entity"
                        />
                     </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                     <button
                        onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={isAddModalOpen ? handleCreate : handleUpdate}
                        disabled={saving || !formData.name.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <Save size={16} />
                        {saving ? 'Saving...' : isAddModalOpen ? 'Create Institution' : 'Save Changes'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Saccos;
