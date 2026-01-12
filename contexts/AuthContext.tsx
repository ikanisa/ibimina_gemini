import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { StaffRole, SupabaseProfile, UserRole } from '../types';
import { withTimeout } from '../lib/utils/timeout';
import { deduplicateRequest } from '../lib/utils/requestDeduplication';
import { setUser as setSentryUser, clearUser as clearSentryUser } from '../lib/sentry';

interface AuthContextType {
  user: User | null;
  profile: SupabaseProfile | null;
  institutionId: string | null;
  role: StaffRole | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeStaffRole = (value: unknown): StaffRole | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const staffRoles: StaffRole[] = ['Admin', 'Staff'];
  if (staffRoles.includes(trimmed as StaffRole)) {
    return trimmed as StaffRole;
  }

  const normalized = trimmed.toUpperCase();
  switch (normalized) {
    case 'ADMIN':
    case 'PLATFORM_ADMIN':
    case 'INSTITUTION_ADMIN':
    case 'SUPER ADMIN':
    case 'BRANCH MANAGER':
      return 'Admin';
    case 'STAFF':
    case 'INSTITUTION_STAFF':
    case 'INSTITUTION_TREASURER':
    case 'INSTITUTION_AUDITOR':
    case 'LOAN OFFICER':
    case 'TELLER':
    case 'AUDITOR':
    default:
      return 'Staff';
  }
};

const extractInstitutionId = (user: User | null): string | null => {
  if (!user) return null;
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const value = metadata?.institution_id ?? metadata?.institutionId ?? metadata?.institution;
  return typeof value === 'string' ? value : null;
};

const extractRole = (user: User | null): StaffRole | null => {
  if (!user) return null;
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const roleValue = metadata?.role ?? metadata?.staff_role ?? metadata?.role_label;
  return normalizeStaffRole(roleValue);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const applyingUserRef = useRef<boolean>(false);
  const currentUserIdRef = useRef<string | null>(null);

  const resetAuthState = () => {
    setUser(null);
    setProfile(null);
    setInstitutionId(null);
    setRole(null);
    // Clear user context in Sentry
    clearSentryUser();
  };

  const fetchProfile = async (nextUser: User): Promise<SupabaseProfile | null> => {
    // Use deduplication to prevent multiple simultaneous requests for the same user
    const key = `fetchProfile:${nextUser.id}`;
    return deduplicateRequest(key, async () => {
      try {
        const profileQuery = supabase
          .from('profiles')
          .select('user_id, institution_id, role, email, full_name, branch, avatar_url, status, last_login_at')
          .eq('user_id', nextUser.id)
          .maybeSingle();

        const result = await withTimeout(
          Promise.resolve(profileQuery),
          10000, // Reduced to 10 second timeout
          'Profile fetch timeout'
        );
        const { data, error } = result;

        if (error) {
          console.error('Error loading profile:', error);
          return null;
        }

        return (data as SupabaseProfile | null) ?? null;
      } catch (err) {
        console.error('Profile fetch failed:', err);
        return null;
      }
    });
  };

  const applyUser = async (nextUser: User | null) => {
    // Prevent duplicate calls for the same user
    const userId = nextUser?.id || null;
    if (applyingUserRef.current && currentUserIdRef.current === userId) {
      console.log('[Auth] Already applying user, skipping duplicate call');
      return;
    }

    applyingUserRef.current = true;
    currentUserIdRef.current = userId;

    try {
      setUser(nextUser);
      if (!nextUser) {
        resetAuthState();
        return;
      }

      // Fetch profile with timeout and deduplication
      const nextProfile = await fetchProfile(nextUser);
      setProfile(nextProfile);
      setInstitutionId(nextProfile?.institution_id ?? extractInstitutionId(nextUser));
      setRole(nextProfile ? normalizeStaffRole(nextProfile.role) : extractRole(nextUser));

      // Set user context in Sentry for error tracking
      if (nextProfile) {
        setSentryUser({
          id: nextUser.id,
          email: nextProfile.email || nextUser.email || undefined,
          institutionId: nextProfile.institution_id || undefined,
        });
      }

      // Update last login asynchronously (don't block on this)
      if (nextProfile) {
        const lastLoginValue = new Date().toISOString();
        // Fire and forget - don't wait for this
        supabase
          .from('profiles')
          .update({ last_login_at: lastLoginValue })
          .eq('user_id', nextUser.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating last login:', error);
            }
          })
          .catch((err) => {
            console.error('Error updating last login:', err);
          });
      }
    } finally {
      applyingUserRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initTimeout: ReturnType<typeof setTimeout> | null = null;

    const initSession = async () => {
      if (!isSupabaseConfigured) {
        console.log('[Auth] Supabase not configured, skipping');
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setInitError(null);

        // Safety timeout: if initialization takes more than 20 seconds, show error
        initTimeout = setTimeout(() => {
          if (isMounted) {
            console.error('[Auth] Initialization timeout');
            setInitError('Authentication initialization timeout. Please check your connection.');
            setLoading(false);
            setUser(null);
          }
        }, 20000);

        console.log('[Auth] Getting session...');
        const sessionQuery = supabase.auth.getSession();
        const result = await withTimeout(
          Promise.resolve(sessionQuery),
          15000, // 15 second timeout for session fetch
          'Session fetch timeout'
        );
        const { data, error } = result;
        console.log('[Auth] Session result:', { hasSession: !!data.session, error });

        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }

        if (error) throw error;

        if (isMounted) {
          await applyUser(data.session?.user ?? null);
        }
      } catch (err: any) {
        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }
        console.error('[Auth] Initialization error:', err);
        if (isMounted) {
          const errorMessage = err.name === 'TimeoutError'
            ? 'Connection timeout. Please check your network connection.'
            : (err.message || 'Failed to initialize authentication');
          setInitError(errorMessage);
          setUser(null);
        }
      } finally {
        if (initTimeout) {
          clearTimeout(initTimeout);
        }
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    // Set up listener for auth changes with debouncing
    let authChangeTimeout: ReturnType<typeof setTimeout> | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Clear any pending auth change
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }

      // Debounce rapid auth state changes (e.g., token refresh)
      authChangeTimeout = setTimeout(async () => {
        if (!isMounted) return;

        // For auth state changes, we generally want to show loading
        // but strictly for the transition period with a timeout
        setLoading(true);

        try {
          await withTimeout(
            applyUser(session?.user ?? null),
            8000, // Reduced to 8 second timeout for auth state changes
            'Auth state change timeout'
          );
        } catch (err) {
          console.error('Auth state change error:', err);
          if (isMounted && err instanceof Error) {
            setInitError(err.message);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }, event === 'TOKEN_REFRESHED' ? 100 : 0); // Small delay for token refresh, immediate for other events
    });

    return () => {
      isMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }
      subscription.unsubscribe();
      applyingUserRef.current = false;
      currentUserIdRef.current = null;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      return;
    }

    try {
      // Sign out with 'global' scope to invalidate all sessions/refresh tokens
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (err) {
      console.error('Sign out exception:', err);
    }

    // Clear all auth-related items from storage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Also clear session storage
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (storageErr) {
      console.error('Error clearing storage:', storageErr);
    }

    resetAuthState();
  };

  return (
    <AuthContext.Provider value={{ user, profile, institutionId, role, loading, isConfigured: isSupabaseConfigured, signIn, signOut, error: initError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
