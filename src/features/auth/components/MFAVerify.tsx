/**
 * MFA Verification Component
 * Used during login to verify MFA code
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import * as mfaUtils from '../../lib/auth/mfa';

interface MFAVerifyProps {
  factorId: string;
  onVerify: (code: string) => Promise<void>;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export const MFAVerify: React.FC<MFAVerifyProps> = ({ factorId, onVerify, onError, onCancel }) => {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);

  useEffect(() => {
    initializeChallenge();
  }, [factorId]);

  const initializeChallenge = async () => {
    try {
      const { challengeId: id } = await mfaUtils.challengeMFA(factorId);
      setChallengeId(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize MFA challenge';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setVerifying(true);
    setError('');

    try {
      if (!challengeId) {
        throw new Error('MFA challenge not initialized');
      }

      const { verified } = await mfaUtils.verifyMFAChallenge(challengeId, code);
      
      if (verified) {
        await onVerify(code);
      } else {
        const errorMessage = 'Invalid verification code. Please try again.';
        setError(errorMessage);
        setCode('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      setCode('');
      onError?.(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="text-blue-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Two-Factor Authentication</h2>
        <p className="text-slate-600">Enter the code from your authenticator app</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-2xl font-mono tracking-widest"
            placeholder="000000"
            maxLength={6}
            required
            autoFocus
            autoComplete="one-time-code"
          />
          <p className="mt-2 text-xs text-slate-500 text-center">
            Open your authenticator app and enter the 6-digit code
          </p>
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={verifying}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={verifying || code.length !== 6}
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={initializeChallenge}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          disabled={verifying}
        >
          Resend Code
        </button>
      </div>
    </div>
  );
};
