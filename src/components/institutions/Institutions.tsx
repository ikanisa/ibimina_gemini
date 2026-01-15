/**
 * Institutions.tsx - Admin Control Plane for Institution Management
 * 
 * Features:
 * - List all institutions with search and filter
 * - Create/Edit institution via drawer
 * - Detail view with tabs (Overview, MoMo Codes, Staff, Branches, Directory)
 * - Role-based access: PLATFORM_ADMIN full access, INSTITUTION_ADMIN limited
 * - Lazy loading for list
 * - Branch management integrated
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Building, Plus, Search, X, Edit2, MapPin,
  Users, CreditCard, AlertCircle, RefreshCw, ChevronRight,
  Phone, Mail, Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { InstitutionDrawer } from './InstitutionDrawer';
import { CreateInstitutionDrawer } from './CreateInstitutionDrawer';
import { ViewState, InstitutionType } from '../../types';
import { isSuperAdmin } from '../../lib/utils/roleHelpers';
import { deduplicateRequest } from '../../lib/utils/requestDeduplication';

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
  branches_count?: number;
  primary_momo_code?: string | null;
}

interface InstitutionsProps {
  onNavigate?: (view: ViewState) => void;
}

const ITEMS_PER_PAGE = 30;

const Institutions: React.FC<InstitutionsProps> = ({ onNavigate }) => {
  const { role, institutionId: userInstitutionId } = useAuth();
  const isPlatformAdmin = isSuperAdmin(role);

  // Data state
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InstitutionType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  // Refs for lazy loading
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      offsetRef.current = 0;
      setInstitutions([]);
      setHasMore(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset on filter change
  useEffect(() => {
    offsetRef.current = 0;
    setInstitutions([]);
    setHasMore(true);
  }, [typeFilter, statusFilter]);

  // Load institutions
  const loadInstitutions = useCallback(async (reset = false) => {
    if (!isPlatformAdmin && !userInstitutionId) {
      setError('No institution access');
      setLoading(false);
      return;
    }

    if (reset) {
      setLoading(true);
      offsetRef.current = 0;
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      // Use deduplication to prevent duplicate requests
      const key = `loadInstitutions:${isPlatformAdmin ? 'all' : userInstitutionId}:${offsetRef.current}:${debouncedSearch}:${typeFilter}:${statusFilter}`;

      const fetchedInstitutions = await deduplicateRequest(key, async () => {
        let query = supabase
          .from('institutions')
          .select('*')
          .order('name', { ascending: true })
          .range(offsetRef.current, offsetRef.current + ITEMS_PER_PAGE - 1);

        // Non-platform admin can only see their institution
        if (!isPlatformAdmin && userInstitutionId) {
          query = query.eq('id', userInstitutionId);
        }

        // Apply search
        if (debouncedSearch) {
          query = query.or(`name.ilike.%${debouncedSearch}%,code.ilike.%${debouncedSearch}%,supervisor.ilike.%${debouncedSearch}%`);
        }

        // Apply type filter
        if (typeFilter !== 'ALL') {
          query = query.eq('type', typeFilter);
        }

        // Apply status filter
        if (statusFilter !== 'ALL') {
          query = query.eq('status', statusFilter);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw new Error(`Unable to load institutions: ${fetchError.message}`);
        }

        return (data || []) as Institution[];
      });

      // Fetch counts for each institution
      const institutionIds = fetchedInstitutions.map(i => i.id);

      if (institutionIds.length > 0) {
        // Fetch staff counts
        const { data: staffCounts } = await supabase
          .from('profiles')
          .select('institution_id')
          .in('institution_id', institutionIds);

        // Fetch primary momo codes
        const { data: momoCodes } = await supabase
          .from('institution_momo_codes')
          .select('institution_id, momo_code')
          .in('institution_id', institutionIds)
          .eq('is_primary', true)
          .eq('is_active', true);

        // Fetch branch counts
        const { data: branchesData } = await supabase
          .from('branches')
          .select('institution_id')
          .in('institution_id', institutionIds);

        // Count by institution
        const staffCountMap: Record<string, number> = {};
        (staffCounts || []).forEach((s: { institution_id: string }) => {
          staffCountMap[s.institution_id] = (staffCountMap[s.institution_id] || 0) + 1;
        });

        const momoCodeMap: Record<string, string> = {};
        (momoCodes || []).forEach((m: { institution_id: string; momo_code: string }) => {
          momoCodeMap[m.institution_id] = m.momo_code;
        });

        // Build branch count map
        const branchCountMap: Record<string, number> = {};
        (branchesData || []).forEach((b: { institution_id: string }) => {
          branchCountMap[b.institution_id] = (branchCountMap[b.institution_id] || 0) + 1;
        });

        // Enrich institutions with counts
        fetchedInstitutions.forEach(inst => {
          inst.staff_count = staffCountMap[inst.id] || 0;
          inst.primary_momo_code = momoCodeMap[inst.id] || null;
          inst.branches_count = branchCountMap[inst.id] || 0;
        });
      }

      if (reset) {
        setInstitutions(fetchedInstitutions);
      } else {
        setInstitutions(prev => [...prev, ...fetchedInstitutions]);
      }

      setHasMore(fetchedInstitutions.length === ITEMS_PER_PAGE);
      offsetRef.current += fetchedInstitutions.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load institutions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isPlatformAdmin, userInstitutionId, debouncedSearch, typeFilter, statusFilter]);

  // Initial load and filter changes
  useEffect(() => {
    loadInstitutions(true);
  }, [debouncedSearch, typeFilter, statusFilter]);

  // Lazy loading observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadInstitutions(false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadingMore, loadInstitutions]);

  const handleInstitutionClick = (institution: Institution) => {
    setSelectedInstitution(institution);
  };

  const handleCreateSuccess = () => {
    setIsCreateDrawerOpen(false);
    loadInstitutions(true);
  };

  const handleEditSuccess = () => {
    loadInstitutions(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BANK':
        return 'bg-blue-100 text-blue-700';
      case 'MFI':
        return 'bg-purple-100 text-purple-700';
      case 'SACCO':
        return 'bg-teal-100 text-teal-700';
      case 'VC':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  if (error && institutions.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => loadInstitutions(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage financial institutions and their settings
          </p>
        </div>
        {isPlatformAdmin && (
          <button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            Add Institution
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search institutions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as InstitutionType | 'ALL')}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm min-w-[140px]"
          >
            <option value="ALL">All Types</option>
            <option value="BANK">Bank</option>
            <option value="MFI">MFI</option>
            <option value="SACCO">SACCO</option>
            <option value="VC">VC</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm min-w-[140px]"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Institutions List */}
      {loading && institutions.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : institutions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No institutions found</h3>
          <p className="text-sm text-slate-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'Add your first institution to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {institutions.map(institution => (
            <div
              key={institution.id}
              onClick={() => handleInstitutionClick(institution)}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {institution.name}
                    </h3>
                    {institution.code && (
                      <span className="text-xs text-slate-500 font-mono">{institution.code}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(institution.type)}`}>
                  {institution.type}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(institution.status)}`}>
                  {institution.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Users size={14} className="text-slate-400" />
                  <span>{institution.staff_count ?? 0} staff</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Building size={14} className="text-slate-400" />
                  <span>{institution.branches_count ?? 0} branches</span>
                </div>
              </div>

              {/* MoMo Code Warning */}
              {!institution.primary_momo_code && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  <span>No primary MoMo code set</span>
                </div>
              )}
              {institution.primary_momo_code && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  <CreditCard size={14} className="text-slate-400" />
                  <span className="font-mono">{institution.primary_momo_code}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load more trigger */}
      {hasMore && !loading && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          {loadingMore && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          )}
        </div>
      )}

      {/* Institution Detail Drawer */}
      {selectedInstitution && (
        <InstitutionDrawer
          institution={selectedInstitution}
          isOpen={!!selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
          onEdit={handleEditSuccess}
          isPlatformAdmin={isPlatformAdmin}
        />
      )}

      {/* Create Institution Drawer */}
      {isPlatformAdmin && (
        <CreateInstitutionDrawer
          isOpen={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default Institutions;

