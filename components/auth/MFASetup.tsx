/**
 * MFA Setup Component
 * Allows users to set up TOTP MFA using an authenticator app
 */

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Copy, Download } from 'lucide-react';
import { useMFA } from '../../hooks/useMFA';
import * as mfaUtils from '../../lib/auth/mfa';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const { startEnrollment, verifyEnrollment, loading, error } = useMFA();
  const [step, setStep] = useState<'start' | 'verify' | 'complete'>('start');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [uri, setUri] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    initializeEnrollment();
  }, []);

  const initializeEnrollment = async () => {
    try {
      const response = await startEnrollment('Authenticator App');
      setQrCode(response.qr_code);
      setSecret(response.secret);
      setUri(response.uri);
      // Extract factor ID from URI or response
      // Note: Supabase MFA API may return factor ID differently
      setStep('verify');
    } catch (err) {
      console.error('Failed to start MFA enrollment:', err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');

    try {
      // Get factor ID from factors list
      const factors = await mfaUtils.getMFAFactors();
      const unverifiedFactor = factors.find(f => f.status === 'unverified');
      
      if (!unverifiedFactor) {
        throw new Error('No pending MFA factor found');
      }

      const verified = await verifyEnrollment(unverifiedFactor.id, code);
      
      if (verified) {
        // Generate backup codes
        const codes = await mfaUtils.generateBackupCodes();
        setBackupCodes(codes.codes);
        setStep('complete');
        onComplete?.();
      } else {
        setVerifyError('Invalid code. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setVerifyError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
  };

  const downloadBackupCodes = () => {
    const content = `MFA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'start') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Set Up Two-Factor Authentication</h2>
          <p className="text-slate-600">Scan the QR code with your authenticator app</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-slate-200 flex items-center justify-center mb-4">
            {qrCode && (
              <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Or enter this code manually:</p>
            <div className="flex items-center justify-center gap-2">
              <code className="px-3 py-2 bg-slate-100 rounded-lg font-mono text-sm font-semibold">
                {secret}
              </code>
              <button
                onClick={copySecret}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Copy secret"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter verification code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
            <p className="mt-2 text-xs text-slate-500">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {verifyError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {verifyError}
            </div>
          )}

          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={verifying || loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={verifying || loading || code.length !== 6}
            >
              {verifying ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">MFA Enabled Successfully</h2>
          <p className="text-slate-600">Two-factor authentication is now active on your account</p>
        </div>

        {backupCodes.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">Save Your Backup Codes</h3>
            <p className="text-sm text-amber-700 mb-3">
              These codes can be used to access your account if you lose your authenticator device.
              Each code can only be used once.
            </p>
            <div className="bg-white p-3 rounded border border-amber-300 mb-3">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="text-center py-1">{code}</div>
                ))}
              </div>
            </div>
            <button
              onClick={downloadBackupCodes}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download Backup Codes
            </button>
          </div>
        )}

        <button
          onClick={onComplete}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
};
