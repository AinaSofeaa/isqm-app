import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import type { Profile } from '../types';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileLoading: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (partialProfile: Partial<Profile>) => Promise<Profile>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchOrCreateProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as Profile;

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select('*')
      .single();
    if (createError) {
      const { data: retry, error: retryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (retryError) throw retryError;
      if (retry) return retry as Profile;
      throw createError;
    }
    return created as Profile;
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    fetchOrCreateProfile(user.id)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        console.warn('Failed to load profile', err);
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchOrCreateProfile, user?.id]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }
    setProfileLoading(true);
    try {
      const data = await fetchOrCreateProfile(user.id);
      setProfile(data);
      return data;
    } catch (err) {
      console.warn('Failed to refresh profile', err);
      setProfile(null);
      throw err;
    } finally {
      setProfileLoading(false);
    }
  }, [fetchOrCreateProfile, user?.id]);

  const updateProfile = useCallback(async (partialProfile: Partial<Profile>) => {
    if (!user) throw new Error('No authenticated user');
    const userId = user.id;
    const updates = Object.fromEntries(
      Object.entries(partialProfile).filter(([, value]) => value !== undefined)
    ) as Partial<Profile>;
    const payload = { id: userId, ...updates };

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();
      if (error) throw error;
      setProfile(data as Profile);
      return data as Profile;
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  const value = useMemo<AuthState>(() => ({
    session,
    user,
    profile,
    profileLoading,
    isLoading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile,
    updateProfile,
  }), [session, user, profile, profileLoading, isLoading, refreshProfile, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider />');
  return ctx;
};
