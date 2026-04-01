import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types';

export type ProfileUserType = 'student' | 'worker';

export type ProfileSeed = {
  full_name: string | null;
  phone: string | null;
  role: string | null;
  institution: string | null;
  user_type: ProfileUserType | null;
  institution_id: string | null;
  company_name: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cleanText = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const isUuid = (value: unknown): value is string => {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
};

export const normalizeProfileUserType = (value: unknown): ProfileUserType | null => {
  if (value === 'student' || value === 'worker') return value;
  return null;
};

export const normalizeProfileSeed = (seed: Partial<ProfileSeed>): ProfileSeed => {
  const userType = normalizeProfileUserType(seed.user_type);
  const fullName = cleanText(seed.full_name);
  const phone = cleanText(seed.phone);
  const institutionId = userType === 'student' && isUuid(seed.institution_id) ? seed.institution_id.trim() : null;
  const institution = userType === 'student' ? cleanText(seed.institution) : null;
  const companyName = userType === 'worker' ? cleanText(seed.company_name) : null;

  return {
    full_name: fullName,
    phone,
    role: cleanText(seed.role),
    institution,
    user_type: userType,
    institution_id: institutionId,
    company_name: companyName,
  };
};

export const profileSeedFromUser = (user: Pick<User, 'user_metadata'> | null | undefined): ProfileSeed => {
  const meta = user?.user_metadata ?? {};
  return normalizeProfileSeed({
    full_name: meta.full_name,
    phone: meta.phone,
    role: meta.role,
    institution: meta.institution,
    user_type: meta.user_type,
    institution_id: meta.institution_id,
    company_name: meta.company_name,
  });
};

export const buildProfilePayload = (
  userId: string,
  seed: Partial<ProfileSeed> = {},
  existingProfile?: Partial<Profile> | null
) => {
  const normalizedSeed = normalizeProfileSeed(seed);
  const existing = existingProfile ?? null;
  const userType = normalizeProfileUserType(existing?.user_type ?? normalizedSeed.user_type);
  const institutionId = userType === 'student'
    ? (existing?.institution_id ?? normalizedSeed.institution_id ?? null)
    : null;
  const institution = userType === 'student'
    ? (existing?.institution ?? normalizedSeed.institution ?? null)
    : null;
  const companyName = userType === 'worker'
    ? (existing?.company_name ?? normalizedSeed.company_name ?? null)
    : null;

  return {
    id: userId,
    full_name: existing?.full_name ?? normalizedSeed.full_name ?? null,
    phone: existing?.phone ?? normalizedSeed.phone ?? null,
    role: existing?.role ?? normalizedSeed.role ?? null,
    institution,
    user_type: userType,
    institution_id: institutionId,
    company_name: companyName,
  };
};
