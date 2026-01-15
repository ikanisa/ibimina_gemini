import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, Star, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { SettingsCard } from '../SettingsCard';
import { DrawerForm } from '../DrawerForm';
import { HealthBanner } from '../HealthBanner';

interface MomoCode {
  id: string;
  institution_id: string;
  momo_code: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export const InstitutionSettings: React.FC = () => {
  const { institutionId } = useAuth();
  const [codes, setCodes] = useState<MomoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [makePrimary, setMakePrimary] = useState(true);
  const [saving, setSaving] = useState(false);

  const primaryCode = useMemo(() => codes.find((c) => c.is_primary && c.is_active) ?? null, [codes]);

  const loadCodes = async () => {
    if (!institutionId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('institution_momo_codes')
      .select('id, institution_id, momo_code, is_primary, is_active, created_at')
      .eq('institution_id', institutionId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load MoMo codes:', error);
      setCodes([]);
    } else {
      setCodes((data as MomoCode[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const healthIssues = useMemo(() => {
    const issues: Array<{
      type: 'info' | 'warning' | 'alert';
      message: string;
      action?: string;
      onClick?: () => void;
    }> = [];

    if (!primaryCode) {
      issues.push({
        type: 'warning',
        message: 'No primary MoMo code configured',
        action: 'Add a primary MoMo code to enable institution matching',
        onClick: () => setShowDrawer(true),
      });
    }

    return issues;
  }, [primaryCode]);

  const handleAddCode = async () => {
    if (!institutionId) return;
    const code = newCode.trim();
    if (!code) return;

    setSaving(true);
    try {
      const shouldBePrimary = makePrimary || codes.length === 0;

      // Preferred RPC in this codebase (supports primary enforcement + audit logging)
      const { error } = await supabase.rpc('set_institution_momo_code', {
        p_institution_id: institutionId,
        p_momo_code: code,
        p_is_primary: shouldBePrimary,
      });

      if (error) throw error;

      setNewCode('');
      setMakePrimary(true);
      setShowDrawer(false);
      await loadCodes();
    } catch (err) {
      console.error('Failed to add MoMo code:', err);
      alert('Failed to save MoMo code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (code: string) => {
    if (!institutionId) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('set_primary_momo_code', {
        p_institution_id: institutionId,
        p_momo_code: code,
      });
      if (error) throw error;
      await loadCodes();
    } catch (err) {
      console.error('Failed to set primary code:', err);
      alert('Failed to set primary MoMo code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institution</h1>
          <p className="text-sm text-slate-500 mt-1">Manage institution-level MoMo codes used for matching and parsing</p>
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Code
        </button>
      </div>

      <HealthBanner issues={healthIssues} />

      <SettingsCard
        title="MoMo Codes"
        description="Codes used to identify your institution (one active primary required)"
        icon={Building2}
        action={
          primaryCode ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              <Star size={14} />
              Primary set
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
              <AlertTriangle size={14} />
              Missing primary
            </span>
          )
        }
      >
        {codes.length === 0 ? (
          <div className="text-sm text-slate-500">
            No MoMo codes yet. Add one to enable matching.
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-900 truncate">{c.momo_code}</span>
                    {c.is_primary && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        Primary
                      </span>
                    )}
                    {!c.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Added {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
                {!c.is_primary && c.is_active && (
                  <button
                    onClick={() => handleSetPrimary(c.momo_code)}
                    disabled={saving}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    Make primary
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      <DrawerForm
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title="Add MoMo Code"
        description="Add a code used to identify this institution. You can mark it as the primary code."
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowDrawer(false)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCode}
              disabled={saving || !newCode.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">MoMo Code</label>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="e.g. *182*8*1#"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={makePrimary}
              onChange={(e) => setMakePrimary(e.target.checked)}
              className="rounded border-slate-300"
            />
            Make this the primary code
          </label>

          <div className="text-xs text-slate-500">
            Primary codes are used for institution matching in SMS ingest and operational health checks.
          </div>
        </div>
      </DrawerForm>
    </div>
  );
};

export default InstitutionSettings;
