import React, { useState, useEffect } from 'react';
import { Cpu, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { SettingsCard } from '../SettingsCard';
import { SaveBar } from '../SaveBar';
import { HealthBanner } from '../HealthBanner';

interface ParsingConfig {
  parse_mode: 'deterministic' | 'ai_fallback';
  confidence_threshold: number;
  dedupe_window_minutes: number;
}

export const ParsingSettings: React.FC = () => {
  const { institutionId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [config, setConfig] = useState<ParsingConfig>({
    parse_mode: 'ai_fallback',
    confidence_threshold: 0.85,
    dedupe_window_minutes: 5
  });
  
  const [originalConfig, setOriginalConfig] = useState<ParsingConfig | null>(null);
  
  // Stats for impact indicator
  const [recentStats, setRecentStats] = useState({
    totalTransactions: 0,
    lowConfidenceCount: 0
  });

  useEffect(() => {
    loadSettings();
  }, [institutionId]);

  const loadSettings = async () => {
    if (!institutionId) return;
    
    setLoading(true);
    
    // Load institution settings
    const { data: settingsData } = await supabase
      .from('institution_settings')
      .select('*')
      .eq('institution_id', institutionId)
      .single();
    
    if (settingsData) {
      const loaded = {
        parse_mode: settingsData.parsing_mode || 'ai_fallback',
        confidence_threshold: settingsData.confidence_threshold || 0.85,
        dedupe_window_minutes: settingsData.dedupe_window_minutes || 60
      };
      setConfig(loaded);
      setOriginalConfig(loaded);
    }
    
    // Load recent transaction stats for impact indicator
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: totalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .gte('created_at', sevenDaysAgo.toISOString());
    
    const { count: lowConfCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .lt('parse_confidence', config.confidence_threshold);
    
    setRecentStats({
      totalTransactions: totalCount || 0,
      lowConfidenceCount: lowConfCount || 0
    });
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (!institutionId) return;
    
    // Validation
    if (config.confidence_threshold < 0.5 || config.confidence_threshold > 1.0) {
      alert('Confidence threshold must be between 0.5 and 1.0');
      return;
    }
    
    if (config.dedupe_window_minutes < 1 || config.dedupe_window_minutes > 60) {
      alert('Dedupe window must be between 1 and 60 minutes');
      return;
    }
    
    setIsSaving(true);
    
    const { error } = await supabase.rpc('update_parsing_settings', {
      p_institution_id: institutionId,
      p_parsing_mode: config.parse_mode,
      p_confidence_threshold: config.confidence_threshold,
      p_dedupe_window_minutes: config.dedupe_window_minutes
    });
    
    if (error) {
      console.error('Error saving parsing settings:', error);
      alert('Failed to save settings. Please try again.');
    } else {
      setOriginalConfig(config);
      setIsDirty(false);
      await loadSettings();
    }
    
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (originalConfig) {
      setConfig(originalConfig);
    }
    setIsDirty(false);
  };

  const updateConfig = (updates: Partial<ParsingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const impactPercentage = recentStats.totalTransactions > 0
    ? Math.round((recentStats.lowConfidenceCount / recentStats.totalTransactions) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Parsing</h1>
        <p className="text-sm text-slate-500 mt-1">Configure how MoMo SMS messages are parsed and processed</p>
      </div>

      {/* Mode Selection */}
      <SettingsCard
        title="Parsing Mode"
        description="Choose how SMS messages are interpreted"
        icon={Cpu}
      >
        <div className="space-y-3">
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            config.parse_mode === 'deterministic' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="parse_mode"
              checked={config.parse_mode === 'deterministic'}
              onChange={() => updateConfig({ parse_mode: 'deterministic' })}
              className="mt-0.5"
            />
            <div>
              <p className="font-medium text-slate-900">Deterministic Only</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Use pattern matching only. Faster but may miss edge cases.
              </p>
            </div>
          </label>
          
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            config.parse_mode === 'ai_fallback' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="parse_mode"
              checked={config.parse_mode === 'ai_fallback'}
              onChange={() => updateConfig({ parse_mode: 'ai_fallback' })}
              className="mt-0.5"
            />
            <div>
              <p className="font-medium text-slate-900">AI Fallback Enabled</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Use patterns first, then AI for ambiguous messages. More accurate but slightly slower.
              </p>
            </div>
          </label>
        </div>
      </SettingsCard>

      {/* Confidence Threshold */}
      <SettingsCard
        title="Confidence Threshold"
        description="Minimum confidence score for auto-allocation"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={config.confidence_threshold}
              onChange={(e) => updateConfig({ confidence_threshold: parseFloat(e.target.value) })}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-lg font-semibold text-slate-900 w-16 text-right">
              {Math.round(config.confidence_threshold * 100)}%
            </span>
          </div>
          
          <p className="text-sm text-slate-500">
            Transactions with confidence below this threshold will be sent to the Allocation Queue for manual review.
          </p>
          
          {/* Impact Indicator */}
          {recentStats.totalTransactions > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Info size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Impact Estimate</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  With threshold at {Math.round(config.confidence_threshold * 100)}%, approximately{' '}
                  <strong>{impactPercentage}%</strong> of transactions may go to the Allocation Queue
                  based on the last 7 days ({recentStats.lowConfidenceCount} of {recentStats.totalTransactions}).
                </p>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Dedupe Window */}
      <SettingsCard
        title="Deduplication Window"
        description="Time window to detect duplicate SMS messages"
      >
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            max="60"
            value={config.dedupe_window_minutes}
            onChange={(e) => updateConfig({ dedupe_window_minutes: parseInt(e.target.value) || 5 })}
            className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <span className="text-sm text-slate-600">minutes</span>
        </div>
        <p className="text-sm text-slate-500 mt-3">
          SMS messages with identical content within this window will be marked as duplicates.
        </p>
      </SettingsCard>

      {/* Advanced Settings (collapsed) */}
      <SettingsCard
        title="Advanced Settings"
        description="Parser templates and customization"
      >
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
        </button>
        
        {showAdvanced && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">Parser Templates</p>
                <p className="text-sm text-slate-500 mt-1">
                  Custom parser templates are managed by system administrators. Contact support to add or modify parsing patterns for your institution.
                </p>
              </div>
            </div>
          </div>
        )}
      </SettingsCard>

      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ParsingSettings;

