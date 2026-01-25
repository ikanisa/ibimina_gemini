import React, { useState, useEffect } from 'react';
import { Building, ChevronDown, Check, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Institution {
  id: string;
  name: string;
}

interface InstitutionSwitcherProps {
  selectedInstitutionId: string | null;
  onSelect: (institutionId: string | null) => void;
  isPlatformAdmin: boolean;
}

export const InstitutionSwitcher: React.FC<InstitutionSwitcherProps> = ({
  selectedInstitutionId,
  onSelect,
  isPlatformAdmin
}) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInstitutions = async () => {
    const { data } = await supabase
      .from('institutions')
      .select('id, name')
      .eq('status', 'Active')
      .order('name');

    if (data) {
      setInstitutions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isPlatformAdmin) {
      loadInstitutions();
    }
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) return null;

  const selectedInstitution = institutions.find(i => i.id === selectedInstitutionId);
  const displayName = selectedInstitutionId
    ? selectedInstitution?.name || 'Loading...'
    : 'All Institutions';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
      >
        {selectedInstitutionId ? (
          <Building size={16} />
        ) : (
          <Globe size={16} />
        )}
        <span className="max-w-[150px] truncate">{displayName}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase">Select Institution</p>
            </div>

            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 ${!selectedInstitutionId ? 'bg-blue-50' : ''
                }`}
            >
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-slate-500" />
                <span className="text-sm text-slate-700">All Institutions</span>
              </div>
              {!selectedInstitutionId && <Check size={16} className="text-blue-600" />}
            </button>

            <div className="border-t border-slate-100 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-4 text-center text-sm text-slate-400">
                  Loading...
                </div>
              ) : (
                institutions.map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => {
                      onSelect(inst.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 ${selectedInstitutionId === inst.id ? 'bg-blue-50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-slate-500" />
                      <span className="text-sm text-slate-700 truncate">{inst.name}</span>
                    </div>
                    {selectedInstitutionId === inst.id && <Check size={16} className="text-blue-600" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InstitutionSwitcher;


