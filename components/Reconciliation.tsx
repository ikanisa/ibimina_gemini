import React, { useEffect, useState, useCallback } from 'react';
import { Search, Calendar, Filter, Building2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ReconciliationTabs, QueueList, DetailPanel } from './reconciliation';
import type { ReconciliationTab } from './reconciliation';
import { LoadingSpinner, ErrorDisplay, Button } from './ui';

interface Transaction {
  id: string;
  occurred_at: string;
  amount: number;
  payer_phone?: string;
  payer_name?: string;
  momo_ref?: string;
  momo_tx_id?: string;
  allocation_status: string;
  member_id?: string;
  group_id?: string;
  parse_confidence?: number;
  source_sms_id?: string;
  sms_text?: string;
}

interface ParseError {
  id: string;
  received_at: string;
  sender_phone: string;
  sms_text: string;
  parse_error?: string;
  parse_status: string;
  resolution_status?: string;
  resolution_note?: string;
  institution_id?: string;
}

interface DuplicateGroup {
  match_key: string;
  match_type: string;
  transaction_ids: string[];
  dupe_count: number;
  institution_id: string;
  transactions?: Transaction[];
}

const Reconciliation: React.FC = () => {
  const { institutionId, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ReconciliationTab>('unallocated');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [unallocated, setUnallocated] = useState<Transaction[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);

  // Filters
  const [dateRange, setDateRange] = useState(7); // days
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Selected item
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Platform admin institution switcher
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const isPlatformAdmin = profile?.role === 'PLATFORM_ADMIN';

  const effectiveInstitutionId = isPlatformAdmin ? selectedInstitutionId : institutionId;

  // Load institutions for platform admin
  useEffect(() => {
    if (!isPlatformAdmin) return;

    const loadInstitutions = async () => {
      const { data } = await supabase
        .from('institutions')
        .select('id, name')
        .order('name');
      if (data) {
        setInstitutions(data);
        if (data.length > 0 && !selectedInstitutionId) {
          setSelectedInstitutionId(data[0].id);
        }
      }
    };
    loadInstitutions();
  }, [isPlatformAdmin, selectedInstitutionId]);

  // Load data based on active tab
  const loadData = useCallback(async () => {
    if (!effectiveInstitutionId && !isPlatformAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - dateRange);

    try {
      // Load unallocated transactions
      let unallocatedQuery = supabase
        .from('transactions')
        .select('id, occurred_at, amount, payer_phone, payer_name, momo_ref, momo_tx_id, allocation_status, member_id, group_id, parse_confidence, source_sms_id')
        .eq('allocation_status', 'unallocated')
        .gte('occurred_at', fromDate.toISOString())
        .order('occurred_at', { ascending: false });

      if (effectiveInstitutionId) {
        unallocatedQuery = unallocatedQuery.eq('institution_id', effectiveInstitutionId);
      }

      if (searchQuery) {
        unallocatedQuery = unallocatedQuery.or(
          `payer_phone.ilike.%${searchQuery}%,momo_ref.ilike.%${searchQuery}%,payer_name.ilike.%${searchQuery}%`
        );
      }

      const { data: unallocatedData, error: unallocatedError } = await unallocatedQuery;
      if (unallocatedError) throw unallocatedError;
      setUnallocated(unallocatedData || []);

      // Load parse errors
      let parseErrorQuery = supabase
        .from('momo_sms_raw')
        .select('id, received_at, sender_phone, sms_text, parse_error, parse_status, resolution_status, resolution_note, institution_id')
        .eq('parse_status', 'error')
        .eq('resolution_status', 'open')
        .gte('received_at', fromDate.toISOString())
        .order('received_at', { ascending: false });

      if (effectiveInstitutionId) {
        parseErrorQuery = parseErrorQuery.eq('institution_id', effectiveInstitutionId);
      }

      if (searchQuery) {
        parseErrorQuery = parseErrorQuery.or(
          `sender_phone.ilike.%${searchQuery}%,sms_text.ilike.%${searchQuery}%`
        );
      }

      const { data: parseErrorData, error: parseErrorErr } = await parseErrorQuery;
      if (parseErrorErr) throw parseErrorErr;
      setParseErrors(parseErrorData || []);

      // Load duplicate candidates from view
      let dupeQuery = supabase
        .from('vw_duplicate_candidates')
        .select('*');

      if (effectiveInstitutionId) {
        dupeQuery = dupeQuery.eq('institution_id', effectiveInstitutionId);
      }

      const { data: dupeData, error: dupeError } = await dupeQuery;
      if (dupeError) {
        console.warn('Duplicate view error:', dupeError);
        setDuplicates([]);
      } else {
        setDuplicates(dupeData || []);
      }

    } catch (err: any) {
      console.error('Error loading reconciliation data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [effectiveInstitutionId, isPlatformAdmin, dateRange, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load transactions for duplicate group when selected
  useEffect(() => {
    if (activeTab !== 'duplicates' || !selectedId) return;

    const group = duplicates.find((d) => d.match_key === selectedId);
    if (!group || group.transactions) return;

    const loadGroupTransactions = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .in('id', group.transaction_ids);

      if (data) {
        setDuplicates((prev) =>
          prev.map((d) =>
            d.match_key === selectedId ? { ...d, transactions: data } : d
          )
        );
      }
    };
    loadGroupTransactions();
  }, [activeTab, selectedId, duplicates]);

  // Get selected item
  const getSelectedItem = () => {
    if (!selectedId) return null;
    if (activeTab === 'unallocated') {
      return unallocated.find((t) => t.id === selectedId) || null;
    }
    if (activeTab === 'parse-errors') {
      return parseErrors.find((e) => e.id === selectedId) || null;
    }
    if (activeTab === 'duplicates') {
      return duplicates.find((d) => d.match_key === selectedId) || null;
    }
    return null;
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setShowDetailPanel(true);
  };

  const handleActionComplete = () => {
    setSelectedId(null);
    setShowDetailPanel(false);
    loadData();
  };

  const counts = {
    unallocated: unallocated.length,
    parseErrors: parseErrors.length,
    duplicates: duplicates.length,
  };

  const currentItems =
    activeTab === 'unallocated'
      ? unallocated
      : activeTab === 'parse-errors'
      ? parseErrors
      : duplicates;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reconciliation</h1>
            <p className="text-sm text-slate-500">
              Resolve unallocated transactions, parse errors, and duplicates
            </p>
          </div>

          {/* Institution switcher for platform admin */}
          {isPlatformAdmin && institutions.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-slate-400" />
              <select
                value={selectedInstitutionId || ''}
                onChange={(e) => setSelectedInstitutionId(e.target.value || null)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phone, ref, name..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Today</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Filter size={14} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4">
          <ErrorDisplay error={error} variant="banner" />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel: Tabs + Queue */}
        <div className="w-full lg:w-96 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
          <ReconciliationTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSelectedId(null);
              setShowDetailPanel(false);
            }}
            counts={counts}
          />

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <QueueList
                type={activeTab}
                items={currentItems}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            )}
          </div>
        </div>

        {/* Right panel: Detail */}
        <div
          className={`
            fixed inset-0 z-50 bg-white lg:relative lg:inset-auto lg:flex-1 lg:z-0
            transform transition-transform duration-300 ease-in-out
            ${showDetailPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Mobile close button */}
          <button
            onClick={() => setShowDetailPanel(false)}
            className="lg:hidden absolute top-4 right-4 p-2 bg-slate-100 rounded-full z-10"
          >
            <X size={20} className="text-slate-600" />
          </button>

          <DetailPanel
            type={activeTab}
            item={getSelectedItem()}
            institutionId={effectiveInstitutionId || institutionId || ''}
            onClose={() => {
              setSelectedId(null);
              setShowDetailPanel(false);
            }}
            onActionComplete={handleActionComplete}
          />
        </div>

        {/* Overlay for mobile */}
        {showDetailPanel && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setShowDetailPanel(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Reconciliation;
