import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isProfileComplete: boolean;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  setProfileComplete: (complete: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isProfileComplete: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
      }));
      if (session?.user) {
        checkProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
      }));
      if (session?.user) {
        checkProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('marketing_agreed')
      .eq('id', userId)
      .single();

    setState(prev => ({
      ...prev,
      isProfileComplete: data?.marketing_agreed !== null && data?.marketing_agreed !== undefined,
    }));
  }

  async function signOut() {
    await supabase.auth.signOut();
    setState({
      session: null,
      user: null,
      isLoading: false,
      isProfileComplete: false,
    });
  }

  function setProfileComplete(complete: boolean) {
    setState(prev => ({ ...prev, isProfileComplete: complete }));
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut, setProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
