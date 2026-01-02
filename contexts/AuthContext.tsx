import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { StaffRole, SupabaseProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: SupabaseProfile | null;
  institutionId: string | null;
  role: StaffRole | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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

  const resetAuthState = () => {
    setUser(null);
    setProfile(null);
    setInstitutionId(null);
    setRole(null);
  };

  const fetchProfile = async (nextUser: User): Promise<SupabaseProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, institution_id, role, email, full_name, branch, avatar_url, status, last_login_at')
      .eq('user_id', nextUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }

    return (data as SupabaseProfile | null) ?? null;
  };

  const applyUser = async (nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) {
      resetAuthState();
      return;
    }

    const nextProfile = await fetchProfile(nextUser);
    setProfile(nextProfile);
    setInstitutionId(nextProfile?.institution_id ?? extractInstitutionId(nextUser));
    setRole(nextProfile ? normalizeStaffRole(nextProfile.role) : extractRole(nextUser));

    if (nextProfile) {
      const lastLoginValue = new Date().toISOString();
      supabase
        .from('profiles')
        .update({ last_login_at: lastLoginValue })
        .eq('user_id', nextUser.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating last login:', error);
          }
        });
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const checkSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking session:', error);
      }
      await applyUser(data.session?.user ?? null);
      if (isMounted) {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      await applyUser(session?.user ?? null);
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
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
    <AuthContext.Provider value={{ user, profile, institutionId, role, loading, isConfigured: isSupabaseConfigured, signIn, signOut }}>
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
