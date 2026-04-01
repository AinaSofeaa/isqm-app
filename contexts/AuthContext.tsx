import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import type { Profile } from '../types';
import { buildProfilePayload, profileSeedFromUser } from '../lib/profileSeed';

const BLOCK_SESSION_KEY = 'isqm.blockNextSession';

const devLogProfile = (message: string, payload: unknown) => {
  if (!import.meta.env.DEV) return;
  console.info(`[AuthContext] ${message}`, payload);
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileLoading: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
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

  const shouldBlockNextSession = () => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(BLOCK_SESSION_KEY) === '1';
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!shouldBlockNextSession()) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } else {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN' && shouldBlockNextSession()) {
        sessionStorage.removeItem(BLOCK_SESSION_KEY);
        setSession(null);
        setUser(null);
        setIsLoading(false);
        supabase.auth.signOut();
        return;
      }
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchOrCreateProfile = useCallback(async (authUser: User) => {
    const userId = authUser.id;
    const seed = profileSeedFromUser(authUser);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;

    if (data) {
      const existingProfile = data as Profile;
      const needsHydration =
        (!!seed.user_type && !existingProfile.user_type) ||
        (!!seed.institution_id && !existingProfile.institution_id) ||
        (!!seed.institution && !existingProfile.institution) ||
        (!!seed.company_name && !existingProfile.company_name) ||
        (!!seed.full_name && !existingProfile.full_name) ||
        (!!seed.phone && !existingProfile.phone);

      if (!needsHydration) return existingProfile;

      const payload = buildProfilePayload(userId, seed, existingProfile);
      devLogProfile('profile hydrate payload', payload);

      const { data: hydrated, error: hydrateError } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();

      if (hydrateError) {
        devLogProfile('profile hydrate error', hydrateError);
        return existingProfile;
      }

      devLogProfile('profile hydrate response', hydrated);
      return hydrated as Profile;
    }

    const payload = buildProfilePayload(userId, seed);
    devLogProfile('profile insert payload', payload);

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert(payload)
      .select('*')
      .single();
    if (createError) {
      devLogProfile('profile insert error', createError);
      const { data: retry, error: retryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (retryError) throw retryError;
      if (retry) return retry as Profile;
      throw createError;
    }
    devLogProfile('profile insert response', created);
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
    fetchOrCreateProfile(user)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        console.error('Failed to load profile', err);
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchOrCreateProfile, user]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }
    setProfileLoading(true);
    try {
      const data = await fetchOrCreateProfile(user);
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Failed to refresh profile', err);
      setProfile(null);
      throw err;
    } finally {
      setProfileLoading(false);
    }
  }, [fetchOrCreateProfile, user]);

  const updateProfile = useCallback(async (partialProfile: Partial<Profile>) => {
    if (!user) throw new Error('No authenticated user');
    const userId = user.id;

    const resolveValue = <K extends keyof Profile>(key: K, fallback: Profile[K] | null) => {
      const value = partialProfile[key];
      if (value !== undefined) return value;
      return fallback;
    };

    const userType = resolveValue('user_type', profile?.user_type ?? null);
    let institutionId = resolveValue('institution_id', profile?.institution_id ?? null);
    let companyName = resolveValue('company_name', profile?.company_name ?? null);

    if (userType === 'student') {
      companyName = null;
    }
    if (userType === 'worker') {
      institutionId = null;
    }

    const payload = {
      id: userId,
      full_name: resolveValue('full_name', profile?.full_name ?? null) ?? null,
      phone: resolveValue('phone', profile?.phone ?? null) ?? null,
      user_type: userType ?? null,
      institution_id: institutionId ?? null,
      company_name: companyName ?? null,
    };

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();
      if (error) {
        const message = (error?.message ?? '').toLowerCase();
        if (message.includes('schema cache')) {
          throw new Error('Database schema not updated yet. Please refresh or try again.');
        }
        throw error;
      }
      setProfile(data as Profile);
      return data as Profile;
    } finally {
      setProfileLoading(false);
    }
  }, [profile, user]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
  }, []);

  const value = useMemo<AuthState>(() => ({
    session,
    user,
    profile,
    profileLoading,
    isLoading,
    logout,
    refreshProfile,
    updateProfile,
  }), [session, user, profile, profileLoading, isLoading, logout, refreshProfile, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider />');
  return ctx;
};
