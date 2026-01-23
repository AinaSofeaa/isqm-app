import { SavedResult } from '../types';

const STORAGE_KEY = 'isqm-history';

const safeGetHistory = (): SavedResult[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedResult[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const persistHistory = (items: SavedResult[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `isqm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const saveResult = (entry: Omit<SavedResult, 'id' | 'timestamp'>) => {
  const record: SavedResult = {
    ...entry,
    id: generateId(),
    timestamp: Date.now()
  };
  const history = [record, ...safeGetHistory()];
  persistHistory(history);
  return record;
};

export const getHistory = (): SavedResult[] => safeGetHistory();

export const clearHistory = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

export const deleteHistoryItem = (id: string) => {
  const filtered = safeGetHistory().filter((item) => item.id !== id);
  persistHistory(filtered);
};
