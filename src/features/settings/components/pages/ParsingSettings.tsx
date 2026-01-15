import React, { useEffect, useMemo } from 'react';
import { Sliders } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { SettingsCard } from '../SettingsCard';
import { SettingsPage } from '../SettingsPage';
import { useSettings } from '@/hooks/useSettings';

type ParsingMode = 'deterministic' | 'ai_fallback';

interface InstitutionSettingsRow {
  institution_id: string;
  parsing_mode: ParsingMode;
  confidence_threshold: number;
  dedupe_window_minutes: number;
  low_confidence_alert_enabled: boolean;
  unallocated_alert_threshold: number;
  updated_at?: string;
}

const DEFAULTS: InstitutionSettingsRow = {
  institution_id: '',
  parsing_mode: 'deterministic',
  confidence_threshold: 0.85,
  dedupe_window_minutes: 60,
  low_confidence_alert_enabled: true,
  unallocated_alert_threshold: 10,
};

export const ParsingSettings: React.FC = () => {
  const { institutionId } = useAuth();

  const loadSettings = async (): Promise<InstitutionSettingsRow> => {
    if (!institutionId) {
      return { ...DEFAULTS, institution_id: institutionId || '' };
    }

    const { data, error: loadError } = await supabase
      .from('institutions')
      .select('id, parsing_mode, confidence_threshold, dedupe_window_minutes, low_confidence_alert_enabled, unallocated_alert_threshold, updated_at')
      .eq('id', institutionId)
      .maybeSingle();

    if (loadError) {
      console.error('Failed to load institution settings:', loadError);
      return { ...DEFAULTS, institution_id: institutionId };
    }

    return {
      institution_id: institutionId,
      parsing_mode: (data?.parsing_mode as ParsingMode) ?? DEFAULTS.parsing_mode,
      confidence_threshold: Number(data?.confidence_threshold ?? DEFAULTS.confidence_threshold),
      dedupe_window_minutes: Number(data?.dedupe_window_minutes ?? DEFAULTS.dedupe_window_minutes),
      low_confidence_alert_enabled: Boolean(data?.low_confidence_alert_enabled ?? DEFAULTS.low_confidence_alert_enabled),
      unallocated_alert_threshold: Number(data?.unallocated_alert_threshold ?? DEFAULTS.unallocated_alert_threshold),
      updated_at: data?.updated_at ?? undefined,
    };
  };

  const saveSettings = async (data: InstitutionSettingsRow): Promise<InstitutionSettingsRow> => {
    if (!institutionId) throw new Error('No institution ID');

    // Update institutions table directly
    const { error: saveError, data: saved } = await supabase
      .from('institutions')
      .update({
        parsing_mode: data.parsing_mode,
        confidence_threshold: data.confidence_threshold,
        dedupe_window_minutes: data.dedupe_window_minutes,
        low_confidence_alert_enabled: data.low_confidence_alert_enabled,
        unallocated_alert_threshold: data.unallocated_alert_threshold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', institutionId)
      .select()
      .single();

    if (saveError) throw saveError;

    return {
      institution_id: institutionId,
      parsing_mode: (saved?.parsing_mode as ParsingMode) ?? data.parsing_mode,
      confidence_threshold: Number(saved?.confidence_threshold ?? data.confidence_threshold),
      dedupe_window_minutes: Number(saved?.dedupe_window_minutes ?? data.dedupe_window_minutes),
      low_confidence_alert_enabled: Boolean(saved?.low_confidence_alert_enabled ?? data.low_confidence_alert_enabled),
      unallocated_alert_threshold: Number(saved?.unallocated_alert_threshold ?? data.unallocated_alert_threshold),
      updated_at: saved?.updated_at ?? undefined,
    };
  };

  const {
    loading,
    saving,
    error,
    draft,
    isDirty,
    setDraft,
    load,
    save,
    cancel
  } = useSettings({
    initialData: null,
    onLoad: loadSettings,
    onSave: saveSettings,
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const healthIssues = useMemo(() => {
    const issues: Array<{ type: 'info' | 'warning' | 'alert'; message: string; action?: string }> = [];
    if (!draft) return issues;

    if (draft.parsing_mode === 'ai_fallback') {
      issues.push({
        type: 'info',
        message: 'AI fallback is enabled for parsing failures',
        action: 'Ensure OPENAI_API_KEY and GEMINI_API_KEY are set in Supabase Edge Function secrets.',
      });
    }

    if (draft.confidence_threshold < 0.6) {
      issues.push({
        type: 'warning',
        message: 'Low confidence threshold may increase false positives',
        action: 'Consider using 0.80–0.95 for safer allocation queue quality.',
      });
    }

    if (draft.dedupe_window_minutes < 10) {
      issues.push({
        type: 'warning',
        message: 'Very small dedupe window may allow duplicate transactions',
        action: 'Recommended: 30–120 minutes.',
      });
    }

    return issues;
  }, [draft]);

  const handleSave = async () => {
    try {
      await save();
    } catch (err) {
      // Error is already set by useSettings hook
      console.error('Failed to save parsing settings:', err);
    }
  };

  if (loading) {
    return (
      <SettingsPage title="Parsing Settings" description="Configure parsing rules and thresholds">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SettingsPage>
    );
  }

  if (error) {
    return (
      <SettingsPage title="Parsing Settings" description="Configure parsing rules and thresholds">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={() => load()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage title="Parsing Settings" description="Configure parsing rules and thresholds">
      {!draft ? null : (
        <SettingsCard
          title="Parsing Rules"
          description="Control parser mode, confidence threshold, and deduplication"
          icon={Sliders}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
              <select
                value={draft.parsing_mode}
                onChange={(e) => setDraft((p) => (p ? { ...p, parsing_mode: e.target.value as ParsingMode } : p))}
                className="w-full md:max-w-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="deterministic">Deterministic only</option>
                <option value="ai_fallback">Deterministic + AI fallback</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                AI is only used when deterministic parsing fails and is never exposed in the UI.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confidence threshold</label>
              <input
                type="number"
                min={0.5}
                max={1}
                step={0.01}
                value={draft.confidence_threshold}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, confidence_threshold: Number(e.target.value) } : p))
                }
                className="w-full md:max-w-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Recommended: 0.80–0.95</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deduplication window (minutes)</label>
              <input
                type="number"
                min={5}
                max={1440}
                step={1}
                value={draft.dedupe_window_minutes}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, dedupe_window_minutes: Number(e.target.value) } : p))
                }
                className="w-full md:max-w-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Recommended: 30–120</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="low_conf_alert"
                type="checkbox"
                checked={draft.low_confidence_alert_enabled}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, low_confidence_alert_enabled: e.target.checked } : p))
                }
                className="rounded border-slate-300"
              />
              <label htmlFor="low_conf_alert" className="text-sm text-slate-700">
                Enable low-confidence alert banner
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unallocated alert threshold</label>
              <input
                type="number"
                min={0}
                step={1}
                value={draft.unallocated_alert_threshold}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, unallocated_alert_threshold: Number(e.target.value) } : p))
                }
                className="w-full md:max-w-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Show a dashboard/health warning when unallocated transactions exceed this value.
              </p>
            </div>
          </div>
        </SettingsCard>
      )}
    </SettingsPage>
  );
};

export default ParsingSettings;
