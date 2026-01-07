import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, Users, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Member {
  id: string;
  full_name: string;
  phone?: string;
  member_code?: string;
  group_id: string;
  group_name?: string;
}

interface MemberSearchPickerProps {
  institutionId: string;
  onSelect: (member: Member) => void;
  onCancel: () => void;
  selectedMemberId?: string;
}

const MemberSearchPicker: React.FC<MemberSearchPickerProps> = ({
  institutionId,
  onSelect,
  onCancel,
  selectedMemberId,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const searchMembers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          phone,
          member_code,
          group_id,
          groups!inner(name)
        `)
        .eq('institution_id', institutionId)
        .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,member_code.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      const members = (data || []).map((m: any) => ({
        id: m.id,
        full_name: m.full_name,
        phone: m.phone,
        member_code: m.member_code,
        group_id: m.group_id,
        group_name: m.groups?.name,
      }));

      setResults(members);
    } catch (err) {
      console.error('Error searching members:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchMembers(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query, searchMembers]);

  const handleSelect = (member: Member) => {
    setSelectedMember(member);
  };

  const handleConfirm = () => {
    if (selectedMember) {
      onSelect(selectedMember);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Select Member to Allocate</h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
        >
          <X size={18} className="text-slate-500" />
        </button>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, or member code..."
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          autoFocus
        />
        {loading && (
          <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Results list */}
      <div className="max-h-64 overflow-y-auto mb-4">
        {results.length > 0 ? (
          <div className="space-y-2">
            {results.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedMember?.id === member.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-full">
                    <User size={16} className="text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900">{member.full_name}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                      {member.phone && <span>{member.phone}</span>}
                      {member.member_code && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded">
                          {member.member_code}
                        </span>
                      )}
                    </div>
                    {member.group_name && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Users size={12} />
                        {member.group_name}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : query.length >= 2 && !loading ? (
          <div className="text-center py-8 text-slate-400">
            <User size={32} className="mx-auto mb-2 opacity-50" />
            <p>No members found</p>
          </div>
        ) : query.length < 2 ? (
          <div className="text-center py-8 text-slate-400">
            <Search size={32} className="mx-auto mb-2 opacity-50" />
            <p>Type at least 2 characters to search</p>
          </div>
        ) : null}
      </div>

      {/* Selected member confirmation */}
      {selectedMember && (
        <div className="border-t border-slate-200 pt-4">
          <div className="bg-blue-50 p-3 rounded-lg mb-3">
            <div className="text-sm text-blue-800 font-medium">
              Allocate to: {selectedMember.full_name}
            </div>
            <div className="text-xs text-blue-600">
              Group: {selectedMember.group_name || 'Unknown'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Confirm Allocation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSearchPicker;

