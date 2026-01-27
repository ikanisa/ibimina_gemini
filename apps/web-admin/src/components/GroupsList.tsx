import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SupabaseGroup } from '../types';

// ============================================================================
// COMPONENT: GROUPS LIST
// This component loads groups from Supabase based on the user's institution
// ============================================================================

interface GroupsListProps {
  onSelectGroup: (group: SupabaseGroup) => void;
}

const GroupsList: React.FC<GroupsListProps> = ({ onSelectGroup }) => {
  const { institutionId } = useAuth();
  const [groups, setGroups] = useState<SupabaseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadGroups = useCallback(async () => {
    if (!institutionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading groups:', error);
      } else {
        setGroups((data as SupabaseGroup[]) || []);
      }
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const filteredGroups = groups.filter(g =>
    g.group_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} />
          New Group
        </button>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Group Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Expected Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Frequency</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Created</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGroups.map(group => (
              <tr
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                      {group.group_name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-900">{group.group_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    group.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                    {group.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{group.expected_amount.toLocaleString()} {group.currency}</td>
                <td className="px-6 py-4 text-slate-600">{group.frequency}</td>
                <td className="px-6 py-4 text-slate-500 text-sm">{new Date(group.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <ChevronRight size={18} className="text-slate-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredGroups.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
            <p>No groups found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;
