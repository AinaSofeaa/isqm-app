type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

export const formatSupabaseError = (error: unknown, fallback = '') => {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return normalize(error) || fallback;
  }

  if (error instanceof Error) {
    const message = normalize(error.message);
    return message || fallback;
  }

  const err = error as SupabaseErrorLike;
  const parts = [
    typeof err.message === 'string' ? err.message : '',
    typeof err.details === 'string' ? err.details : '',
    typeof err.hint === 'string' ? err.hint : '',
  ]
    .map(normalize)
    .filter(Boolean);

  const message = parts.join(' ');
  if (!message) return fallback;

  if (err.code && !message.includes(err.code)) {
    return `${message} (code: ${err.code})`;
  }

  return message;
};
