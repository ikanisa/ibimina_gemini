import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, User, Calendar, Activity } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface AuditEvent {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'allocate', label: 'Allocate' },
  { value: 'settings_change', label: 'Settings Change' }
];

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'institution', label: 'Institution' },
  { value: 'momo_code', label: 'MoMo Code' },
  { value: 'sms_source', label: 'SMS Source' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'member', label: 'Member' },
  { value: 'group', label: 'Group' },
  { value: 'settings', label: 'Settings' },
  { value: 'profile', label: 'Profile' }
];

export const AuditLogSettings: React.FC = () => {
  const { institutionId, role } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  const isPlatformAdmin = role === 'Super Admin';
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    action: '',
    entityType: '',
    actor: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [institutionId, filters]);

  const loadEvents = async () => {
    setLoading(true);
    
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    // Filter by institution unless platform admin
    if (!isPlatformAdmin && institutionId) {
      query = query.eq('institution_id', institutionId);
    }
    
    // Apply filters
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo + 'T23:59:59');
    }
    if (filters.action) {
      query = query.ilike('action', `%${filters.action}%`);
    }
    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters.actor) {
      query = query.ilike('actor_email', `%${filters.actor}%`);
    }
    
    const { data, error } = await query;
    
    if (data) {
      setEvents(data);
      setHasMore(data.length === 100);
    }
    
    setLoading(false);
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
    if (action.includes('create') || action.includes('add')) return 'bg-green-100 text-green-700';
    if (action.includes('update') || action.includes('change')) return 'bg-blue-100 text-blue-700';
    if (action.includes('delete') || action.includes('remove') || action.includes('deactivate')) return 'bg-red-100 text-red-700';
    if (action.includes('login') || action.includes('logout')) return 'bg-purple-100 text-purple-700';
    return 'bg-slate-100 text-slate-600';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">View system activity and changes</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showFilters ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
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
                {ACTION_TYPES.map(t => (
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

      {/* Events List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <div className="divide-y divide-slate-100">
            {events.map(event => (
              <div key={event.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Activity size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActionColor(event.action)}`}>
                        {event.action}
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
                      {event.actor_email && (
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          {event.actor_email}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatTimestamp(event.created_at)}
                      </div>
                    </div>
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-slate-50 rounded text-xs font-mono text-slate-600 overflow-x-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {hasMore && events.length > 0 && (
          <div className="p-4 text-center border-t border-slate-100">
            <p className="text-sm text-slate-500">Showing first 100 events. Use filters to narrow results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogSettings;

