/**
 * DeviceDrawer Component
 * Right-side drawer for viewing device details and recent SMS
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Ban, Clock, Hash, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Badge, LoadingSpinner, EmptyState, Button } from '../ui';
import type { SmsGatewayDevice, MomoSmsRaw } from './types';

interface DeviceDrawerProps {
  device: SmsGatewayDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: (device: SmsGatewayDevice) => void;
  onActivate: (device: SmsGatewayDevice) => void;
  onRemove: (device: SmsGatewayDevice) => void;
}

export const DeviceDrawer: React.FC<DeviceDrawerProps> = ({
  device,
  isOpen,
  onClose,
  onSuspend,
  onActivate,
  onRemove,
}) => {
  const { institutionId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recentSms, setRecentSms] = useState<MomoSmsRaw[]>([]);
  const [loadingSms, setLoadingSms] = useState(false);

  useEffect(() => {
    if (isOpen && device) {
      loadRecentSms();
    }
  }, [isOpen, device]);

  const loadRecentSms = async () => {
    if (!device) return;

    setLoadingSms(true);
    try {
      const { data, error } = await supabase
        .from('momo_sms_raw')
        .select('*')
        .eq('device_id', device.id)
        .order('ingested_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) {
        setRecentSms(data);
      }
    } catch (err) {
      console.error('Error loading recent SMS:', err);
    } finally {
      setLoadingSms(false);
    }
  };

  const formatDateTime = (timestamp: string | null): string => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatSmsPreview = (body: string): string => {
    if (body.length <= 60) return body;
    return body.substring(0, 60) + '...';
  };

  if (!isOpen || !device) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{device.device_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={device.status === 'active' ? 'success' : 'danger'}
              >
                {device.status === 'active' ? (
                  <>
                    <CheckCircle2 size={12} className="mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <Ban size={12} className="mr-1" />
                    Suspended
                  </>
                )}
              </Badge>
              {device.status === 'active' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSuspend(device)}
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onActivate(device)}
                >
                  Activate
                </Button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-4"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSpinner size="lg" text="Loading device details..." />
          ) : (
            <div className="p-6 space-y-6">
              {/* Details Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Hash size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">MoMo Code</p>
                      <p className="text-sm font-mono text-slate-900">{device.momo_code}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Institution</p>
                      <p className="text-sm text-slate-900">{device.institution_name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Last SMS received</p>
                      <p className="text-sm text-slate-900">
                        {device.last_sms_received_at
                          ? formatDateTime(device.last_sms_received_at)
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent SMS Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent SMS</h3>
                {loadingSms ? (
                  <LoadingSpinner size="sm" text="Loading SMS..." />
                ) : recentSms.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No SMS yet"
                    description="No messages have been received from this device."
                  />
                ) : (
                  <div className="space-y-2">
                    {recentSms.map((sms) => (
                      <div
                        key={sms.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-xs text-slate-500">
                            {formatDateTime(sms.ingested_at)}
                          </p>
                          <Badge
                            variant={
                              sms.parse_status === 'parsed'
                                ? 'success'
                                : sms.parse_status === 'failed'
                                ? 'danger'
                                : 'default'
                            }
                            size="sm"
                          >
                            {sms.parse_status === 'parsed'
                              ? 'Parsed'
                              : sms.parse_status === 'failed'
                              ? 'Failed'
                              : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700">{formatSmsPreview(sms.body)}</p>
                        {sms.sender && (
                          <p className="text-xs text-slate-500 mt-1">From: {sms.sender}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200">
                <Button
                  variant="danger"
                  onClick={() => onRemove(device)}
                  className="w-full"
                >
                  Remove device
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
