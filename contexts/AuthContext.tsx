import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { StaffRole, SupabaseProfile, UserRole } from '../types';
import { withTimeout } from '../lib/utils/timeout';

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
  const staffRoles: StaffRole[] = ['Super Admin', 'Branch Manager', 'Loan Officer', 'Teller', 'Auditor'];
  if (staffRoles.includes(trimmed as StaffRole)) {
    return trimmed as StaffRole;
  }

  const normalized = trimmed.toUpperCase() as UserRole;
  switch (normalized) {
    case 'PLATFORM_ADMIN':
      return 'Super Admin';
    case 'INSTITUTION_ADMIN':
      return 'Branch Manager';
    case 'INSTITUTION_TREASURER':
      return 'Teller';
    case 'INSTITUTION_AUDITOR':
      return 'Auditor';
    case 'INSTITUTION_STAFF':
      return 'Loan Officer';
    default:
      return null;
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

  const resetAuthState = () => {
    setUser(null);
    setProfile(null);
    setInstitutionId(null);
    setRole(null);
  };

  const fetchProfile = async (nextUser: User): Promise<SupabaseProfile | null> => {
    try {
      const profileQuery = supabase
        .from('profiles')
        .select('user_id, institution_id, role, email, full_name, branch, avatar_url, status, last_login_at')
        .eq('user_id', nextUser.id)
        .maybeSingle();

      const result = await withTimeout(
        Promise.resolve(profileQuery),
        15000, // 15 second timeout
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
  };

  const applyUser = async (nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) {
      resetAuthState();
      return;
    }

    // Fetch profile with timeout
    const nextProfile = await fetchProfile(nextUser);
    setProfile(nextProfile);
    setInstitutionId(nextProfile?.institution_id ?? extractInstitutionId(nextUser));
    setRole(nextProfile ? normalizeStaffRole(nextProfile.role) : extractRole(nextUser));

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

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // For auth state changes, we generally want to show loading
      // but strictly for the transition period with a timeout
      if (isMounted) setLoading(true);

      try {
        await withTimeout(
          applyUser(session?.user ?? null),
          10000, // 10 second timeout for auth state changes
          'Auth state change timeout'
        );
      } catch (err) {
        console.error('Auth state change error:', err);
        if (isMounted && err instanceof Error) {
          setInitError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      subscription.unsubscribe();
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
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
