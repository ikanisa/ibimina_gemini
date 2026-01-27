import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, Plus, Copy, Check, AlertTriangle, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { SettingsCard } from '../SettingsCard';
import { DrawerForm } from '../DrawerForm';
import { HealthBanner } from '../HealthBanner';

interface SmsSource {
  id: string;
  name: string;
  source_type: 'android_gateway' | 'webhook' | 'manual';
  device_identifier: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  webhook_secret: string | null;
  created_at: string;
}

export const SmsSourcesSettings: React.FC = () => {
  const { institutionId } = useAuth();
  const [sources, setSources] = useState<SmsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [newSource, setNewSource] = useState({
    name: '',
    source_type: 'android_gateway' as SmsSource['source_type'],
    device_identifier: ''
  });

  const loadSources = useCallback(async () => {
    if (!institutionId) return;

    setLoading(true);

    const { data } = await supabase
      .from('sms_sources')
      .select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });

    if (data) {
      setSources(data);
    }

    setLoading(false);
  }, [institutionId]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleAddSource = async () => {
    if (!institutionId || !newSource.name.trim()) return;

    // Validate unique device identifier
    if (newSource.device_identifier) {
      const existing = sources.find(s =>
        s.device_identifier === newSource.device_identifier && s.is_active
      );
      if (existing) {
        alert('A source with this device identifier already exists.');
        return;
      }
    }

    setIsSaving(true);

    const { error } = await supabase.rpc('register_sms_source', {
      p_institution_id: institutionId,
      p_name: newSource.name.trim(),
      p_source_type: newSource.source_type,
      p_device_identifier: newSource.device_identifier.trim() || null
    });

    if (error) {
      console.error('Error adding SMS source:', error);
      alert('Failed to add SMS source. Please try again.');
    } else {
      await loadSources();
      setNewSource({ name: '', source_type: 'android_gateway', device_identifier: '' });
      setShowDrawer(false);
    }

    setIsSaving(false);
  };

  const handleDeactivate = async (sourceId: string) => {
    if (!confirm('Are you sure you want to deactivate this SMS source?')) return;

    const { error } = await supabase.rpc('deactivate_sms_source', {
      p_source_id: sourceId
    });

    if (error) {
      console.error('Error deactivating source:', error);
      alert('Failed to deactivate source. Please try again.');
    } else {
      await loadSources();
    }
  };

  const copySecret = async (secret: string, sourceId: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(sourceId);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  const getLastSeenStatus = (lastSeen: string | null) => {
    if (!lastSeen) return { status: 'never', text: 'Never seen', color: 'text-slate-500' };

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      return { status: 'active', text: 'Active now', color: 'text-green-600' };
    } else if (hoursDiff < 24) {
      return { status: 'recent', text: `${Math.round(hoursDiff)}h ago`, color: 'text-slate-600' };
    } else {
      return { status: 'stale', text: `${Math.round(hoursDiff / 24)}d ago`, color: 'text-amber-600' };
    }
  };

  const activeSources = sources.filter(s => s.is_active);
  const hasNoActiveSources = activeSources.length === 0;
  const hasStaleSource = activeSources.some(s => {
    const status = getLastSeenStatus(s.last_seen_at);
    return status.status === 'stale' || status.status === 'never';
  });

  const healthIssues = [];
  if (hasNoActiveSources) {
    healthIssues.push({
      type: 'alert' as const,
      message: 'No active SMS source',
      action: 'Add an SMS source to start receiving transactions',
      onClick: () => setShowDrawer(true)
    });
  } else if (hasStaleSource) {
    healthIssues.push({
      type: 'warning' as const,
      message: 'SMS source not seen in over 24 hours',
      action: 'Check your Android gateway or webhook connection'
    });
  }

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
          <h1 className="text-2xl font-bold text-slate-900">SMS Sources</h1>
          <p className="text-sm text-slate-500 mt-1">Manage devices and webhooks that send MoMo SMS to the system</p>
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Source
        </button>
      </div>

      <HealthBanner issues={healthIssues} />

      {/* Sources List */}
      {activeSources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Smartphone size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No SMS Sources</h3>
          <p className="text-sm text-slate-500 mb-4">
            Add an Android gateway or webhook to start receiving MoMo SMS messages.
          </p>
          <button
            onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Add SMS Source
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSources.map(source => {
            const lastSeenInfo = getLastSeenStatus(source.last_seen_at);

            return (
              <div
                key={source.id}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lastSeenInfo.status === 'active' ? 'bg-green-100 text-green-600' :
                      lastSeenInfo.status === 'stale' || lastSeenInfo.status === 'never' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                      {lastSeenInfo.status === 'active' ? <Wifi size={24} /> : <WifiOff size={24} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{source.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {source.source_type === 'android_gateway' ? 'Android Gateway' :
                            source.source_type === 'webhook' ? 'Webhook' : 'Manual'}
                        </span>
                        <span className={`text-xs ${lastSeenInfo.color}`}>
                          {lastSeenInfo.text}
                        </span>
                      </div>
                      {source.device_identifier && (
                        <p className="text-xs text-slate-500 mt-2 font-mono">
                          ID: {source.device_identifier}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {source.webhook_secret && (
                      <button
                        onClick={() => copySecret(source.webhook_secret!, source.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        {copiedSecret === source.id ? (
                          <>
                            <Check size={14} className="text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copy Secret
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeactivate(source.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Source Drawer */}
      <DrawerForm
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setNewSource({ name: '', source_type: 'android_gateway', device_identifier: '' });
        }}
        title="Add SMS Source"
        description="Configure a new device or webhook to receive MoMo SMS"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDrawer(false)}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSource}
              disabled={isSaving || !newSource.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : 'Add Source'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Source Name
            </label>
            <input
              type="text"
              value={newSource.name}
              onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Office Phone, Main Gateway"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Source Type
            </label>
            <select
              value={newSource.source_type}
              onChange={(e) => setNewSource({ ...newSource, source_type: e.target.value as SmsSource['source_type'] })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="android_gateway">Android Gateway</option>
              <option value="webhook">Webhook</option>
              <option value="manual">Manual Import</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Device Identifier
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={newSource.device_identifier}
              onChange={(e) => setNewSource({ ...newSource, device_identifier: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., device-uuid-123"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Unique identifier for tracking this source. For Android gateways, this is typically the device ID.
            </p>
          </div>

          {newSource.source_type === 'webhook' && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <AlertTriangle size={18} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Webhook Setup</p>
                <p className="text-xs text-blue-700 mt-1">
                  After creating this source, you'll receive a webhook secret. Use this secret to authenticate
                  incoming webhook requests to: <br />
                  <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">
                    POST /functions/v1/ingest-sms
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>
      </DrawerForm>
    </div>
  );
};

export default SmsSourcesSettings;


