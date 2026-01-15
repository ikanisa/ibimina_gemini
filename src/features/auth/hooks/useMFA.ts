/**
 * MFA Hook
 * Provides MFA management functionality
 */

import { useState, useCallback } from 'react';
import * as mfaUtils from '@/lib/auth/mfa';
import type { MFAFactor, MFASetupResponse, MFABackupCodes } from '@/lib/auth/mfa';

interface UseMFAReturn {
  hasMFA: boolean;
  factors: MFAFactor[];
  loading: boolean;
  error: string | null;
  checkMFA: () => Promise<void>;
  startEnrollment: (friendlyName?: string) => Promise<MFASetupResponse>;
  verifyEnrollment: (factorId: string, code: string) => Promise<boolean>;
  unenroll: (factorId: string) => Promise<void>;
  refreshFactors: () => Promise<void>;
}

export function useMFA(): UseMFAReturn {
  const [hasMFA, setHasMFA] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMFA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const enabled = await mfaUtils.hasMFAEnabled();
      const userFactors = await mfaUtils.getMFAFactors();
      setHasMFA(enabled);
      setFactors(userFactors);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check MFA status';
      setError(errorMessage);
      console.error('MFA check error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startEnrollment = useCallback(async (friendlyName?: string): Promise<MFASetupResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await mfaUtils.startMFAEnrollment(friendlyName);
      // Refresh factors after starting enrollment
      await refreshFactors();
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start MFA enrollment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEnrollment = useCallback(async (factorId: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const verified = await mfaUtils.verifyMFAEnrollment(factorId, code);
      if (verified) {
        await refreshFactors();
      }
      return verified;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify MFA code';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unenroll = useCallback(async (factorId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await mfaUtils.unenrollMFA(factorId);
      await refreshFactors();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove MFA';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshFactors = useCallback(async () => {
    try {
      const userFactors = await mfaUtils.getMFAFactors();
      const enabled = userFactors.some(f => f.status === 'verified');
      setFactors(userFactors);
      setHasMFA(enabled);
    } catch (err) {
      console.error('Error refreshing MFA factors:', err);
    }
  }, []);

  return {
    hasMFA,
    factors,
    loading,
    error,
    checkMFA,
    startEnrollment,
    verifyEnrollment,
    unenroll,
    refreshFactors,
  };
}
