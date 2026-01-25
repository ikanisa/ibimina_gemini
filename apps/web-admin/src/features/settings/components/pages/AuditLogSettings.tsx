import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Filter, User, Calendar, Activity, ChevronRight, 
  X, ExternalLink, RefreshCw, ChevronDown, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { ViewState } from '@/core/types';

interface AuditEvent {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  institution_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface AuditLogResponse {
  success: boolean;
  items: AuditEvent[];
  has_more: boolean;
  next_cursor: string | null;
}

// Standardized action taxonomy
const ACTION_CATEGORIES = {
  sms: ['SMS_INGESTED', 'SMS_PARSED', 'SMS_PARSE_FAILED', 'SMS_IGNORED', 'SMS_RETRY', 'mark_sms_ignored', 'retry_parse_sms', 'resolve_sms_error'],
  transactions: ['TX_CREATED', 'TX_ALLOCATED', 'TX_MARKED_DUPLICATE', 'TX_FLAGGED', 'TX_REVERSED', 'allocate_transaction', 'mark_transaction_duplicate', 'parse_momo_sms'],
  members: ['MEMBER_CREATED', 'MEMBER_UPDATED', 'MEMBER_IMPORTED', 'create_member', 'update_member', 'bulk_create_member', 'bulk_update_member'],
  groups: ['GROUP_CREATED', 'GROUP_UPDATED', 'GROUP_IMPORTED', 'create_group', 'update_group', 'bulk_create_group', 'bulk_update_group'],
  settings: ['SETTINGS_UPDATED', 'MOMO_CODE_SET', 'SMS_SOURCE_REGISTERED', 'SMS_SOURCE_DEACTIVATED', 'update_institution_settings', 'set_primary_momo_code', 'register_sms_source', 'deactivate_sms_source'],
  institutions: ['INSTITUTION_CREATED', 'INSTITUTION_UPDATED', 'INSTITUTION_SUSPENDED', 'create_institution', 'update_institution', 'suspend_institution_staff'],
  staff: ['STAFF_INVITED', 'STAFF_INVITE_REVOKED', 'STAFF_ROLE_UPDATED', 'STAFF_DEACTIVATED', 'STAFF_REACTIVATED', 'STAFF_TRANSFERRED', 'create_staff_invite', 'revoke_staff_invite', 'update_staff_role', 'deactivate_staff', 'reactivate_staff', 'transfer_staff_out', 'transfer_staff_in'],
  auth: ['USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_CHANGED'],
};

const ACTION_FILTERS = [
  { value: '', label: 'All Actions' },
  { value: 'SMS', label: 'SMS/Ingestion' },
  { value: 'TX', label: 'Transactions' },
  { value: 'allocate', label: 'Allocation' },
  { value: 'MEMBER', label: 'Members' },
  { value: 'GROUP', label: 'Groups' },
  { value: 'SETTINGS', label: 'Settings' },
  { value: 'INSTITUTION', label: 'Institutions' },
  { value: 'STAFF', label: 'Staff' },
];

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'momo_sms_raw', label: 'SMS' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'member', label: 'Member' },
  { value: 'group', label: 'Group' },
  { value: 'institution', label: 'Institution' },
  { value: 'institution_momo_codes', label: 'MoMo Code' },
  { value: 'sms_sources', label: 'SMS Source' },
  { value: 'institution_settings', label: 'Settings' },
  { value: 'profile', label: 'Staff Profile' },
  { value: 'staff_invite', label: 'Staff Invite' },
];

interface AuditLogSettingsProps {
  onNavigate?: (view: ViewState) => void;
}

export const AuditLogSettings: React.FC<AuditLogSettingsProps> = ({ onNavigate }) => {
  const { institutionId, role } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Selected event for detail drawer
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  
  const isPlatformAdmin = role === 'Admin' || role?.toUpperCase() === 'ADMIN';
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    action: '',
    entityType: '',
    actor: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);

  const loadEvents = useCallback(async (cursor?: string | null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setEvents([]);
    }
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('get_audit_log_paginated', {
        p_institution_id: isPlatformAdmin ? null : institutionId,
        p_limit: 50,
        p_cursor: cursor || null,
        p_action_filter: filters.action || null,
        p_entity_type_filter: filters.entityType || null,
        p_actor_filter: filters.actor || null,
        p_date_from: filters.dateFrom ? `${filters.dateFrom}T00:00:00Z` : null,
        p_date_to: filters.dateTo ? `${filters.dateTo}T23:59:59Z` : null,
      });

      if (rpcError) throw rpcError;

      const response = data as AuditLogResponse;
      
      if (response.success) {
        if (cursor) {
          setEvents(prev => [...prev, ...response.items]);
        } else {
          setEvents(response.items);
        }
        setHasMore(response.has_more);
        setNextCursor(response.next_cursor);
      } else {
        throw new Error('Failed to load audit log');
      }
    } catch (err) {
      console.error('Error loading audit log:', err);
      setError('Failed to load audit log. Please try again.');
      
      // Fallback to direct query if RPC doesn't exist yet
      try {
        let query = supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (!isPlatformAdmin && institutionId) {
          query = query.eq('institution_id', institutionId);
        }
        
        if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
        if (filters.dateTo) query = query.lte('created_at', filters.dateTo + 'T23:59:59');
        if (filters.action) query = query.ilike('action', `%${filters.action}%`);
        if (filters.entityType) query = query.eq('entity_type', filters.entityType);
        if (filters.actor) query = query.ilike('actor_email', `%${filters.actor}%`);
        
        const { data: fallbackData, error: fallbackError } = await query;
        
        if (!fallbackError && fallbackData) {
          setEvents(fallbackData);
          setHasMore(fallbackData.length === 50);
          setError(null);
        }
      } catch {
        // Keep the error state
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [institutionId, isPlatformAdmin, filters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      loadEvents(nextCursor);
    }
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      action: '',
      entityType: '',
      actor: ''
    });
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add') || actionLower.includes('register') || actionLower.includes('ingested')) {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (actionLower.includes('update') || actionLower.includes('change') || actionLower.includes('set') || actionLower.includes('allocat')) {
      return 'bg-blue-100 text-blue-700';
    }
    if (actionLower.includes('delete') || actionLower.includes('remove') || actionLower.includes('deactivate') || actionLower.includes('revoke') || actionLower.includes('suspend')) {
      return 'bg-red-100 text-red-700';
    }
    if (actionLower.includes('error') || actionLower.includes('fail')) {
      return 'bg-amber-100 text-amber-700';
    }
    if (actionLower.includes('login') || actionLower.includes('logout') || actionLower.includes('auth')) {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-slate-100 text-slate-600';
  };

  const getActionIcon = (action: string) => {
    return <Activity size={16} />;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.round(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  };

  const getEntityLink = (entityType: string, entityId: string | null) => {
    if (!entityId || !onNavigate) return null;
    
    switch (entityType) {
      case 'transaction':
        return { view: ViewState.TRANSACTIONS, label: 'View Transaction' };
      case 'member':
        return { view: ViewState.MEMBERS, label: 'View Member' };
      case 'group':
        return { view: ViewState.GROUPS, label: 'View Group' };
      case 'institution':
        return { view: ViewState.INSTITUTIONS, label: 'View Institution' };
      default:
        return null;
    }
  };

  // Detail Drawer
  const DetailDrawer = () => {
    if (!selectedEvent) return null;

    const link = getEntityLink(selectedEvent.entity_type, selectedEvent.entity_id);

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        />
        <div className="relative w-full max-w-lg bg-white shadow-xl animate-in slide-in-from-right duration-300">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Audit Event Details</h2>
            <button 
              onClick={() => setSelectedEvent(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
            {/* Action Badge */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Action</label>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getActionColor(selectedEvent.action)}`}>
                {getActionIcon(selectedEvent.action)}
                {formatActionName(selectedEvent.action)}
              </span>
            </div>

            {/* Entity */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Entity</label>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">
                  {selectedEvent.entity_type}
                </span>
                {selectedEvent.entity_id && (
                  <span className="text-sm font-mono text-slate-500">
                    #{selectedEvent.entity_id.slice(0, 8)}...
                  </span>
                )}
              </div>
              {link && onNavigate && (
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    onNavigate(link.view);
                  }}
                  className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ExternalLink size={14} />
                  {link.label}
                </button>
              )}
            </div>

            {/* Actor */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Performed By</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedEvent.actor_name || selectedEvent.actor_email || 'System'}
                  </p>
                  {selectedEvent.actor_email && selectedEvent.actor_name && (
                    <p className="text-xs text-slate-500">{selectedEvent.actor_email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Timestamp</label>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Calendar size={16} className="text-slate-400" />
                {new Date(selectedEvent.created_at).toLocaleString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>

            {/* Metadata */}
            {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Details</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* IDs */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs font-medium text-slate-500 mb-2">Reference IDs</label>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Event ID</span>
                  <span className="font-mono text-slate-600">{selectedEvent.id}</span>
                </div>
                {selectedEvent.entity_id && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Entity ID</span>
                    <span className="font-mono text-slate-600">{selectedEvent.entity_id}</span>
                  </div>
                )}
                {selectedEvent.actor_user_id && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Actor ID</span>
                    <span className="font-mono text-slate-600">{selectedEvent.actor_user_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">View system activity and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadEvents()}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} />
            Filters
            {Object.values(filters).some(v => v) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Action Type</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                {ACTION_FILTERS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                {ENTITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Actor Email</label>
              <input
                type="text"
                value={filters.actor}
                onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
                placeholder="Search by email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="text-sm text-slate-600 hover:text-slate-800 font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-48" />
                    <div className="h-3 bg-slate-100 rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Audit Events</h3>
            <p className="text-sm text-slate-500">
              {Object.values(filters).some(v => v) 
                ? 'No events match your filters' 
                : 'System activity will appear here'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {events.map(event => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full p-4 hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Activity size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActionColor(event.action)}`}>
                          {formatActionName(event.action)}
                        </span>
                        <span className="text-xs text-slate-500">on</span>
                        <span className="text-xs font-medium text-slate-700">{event.entity_type}</span>
                        {event.entity_id && (
                          <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                            #{event.entity_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {(event.actor_email || event.actor_name) && (
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            {event.actor_name || event.actor_email}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatTimestamp(event.created_at)}
                        </div>
                      </div>
                    </div>
                    <ChevronRight 
                      size={18} 
                      className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" 
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}

            {!hasMore && events.length > 0 && (
              <div className="p-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500">End of audit log • {events.length} events shown</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      <DetailDrawer />
    </div>
  );
};

export default AuditLogSettings;
