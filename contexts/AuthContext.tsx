import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Types for auth context
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    institution_id?: string;
  };
}

interface AuthContextType {
  user: User | null;
  institutionId: string | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUser(data.session.user as User);
          setInstitutionId(data.session.user.user_metadata?.institution_id || null);
          // Default role - in production this would come from the database
          setRole('Staff');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionData = session as { user?: User } | null;
      if (sessionData?.user) {
        setUser(sessionData.user);
        setInstitutionId(sessionData.user.user_metadata?.institution_id || null);
        setRole('Staff');
      } else {
        setUser(null);
        setInstitutionId(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await supabase.auth.signInWithPassword({ email, password });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setInstitutionId(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, institutionId, role, loading, signIn, signOut }}>
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
