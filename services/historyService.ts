import { supabase } from './supabaseClient';
import type { SavedResult } from '../types';

type SaveEntry = Omit<SavedResult, 'id' | 'timestamp'>;

export type HistoryFilters = {
  type?: 'all' | 'beam' | 'column' | 'slab';
  fromDate?: string;
  toDate?: string;
};

const OUTPUTS_MISSING_MESSAGE = 'DB migration required: add outputs jsonb';

let outputsColumnAvailable: boolean | null = null;

const isMissingColumnError = (error: any, column: string) => {
  const message = String(error?.message ?? '').toLowerCase();
  const details = String(error?.details ?? '').toLowerCase();
  const code = String(error?.code ?? '');
  if (code === '42703') return true;
  return message.includes(column) || details.includes(column);
};

const ensureOutputsColumn = async () => {
  if (outputsColumnAvailable === true) return;
  if (outputsColumnAvailable === false) throw new Error(OUTPUTS_MISSING_MESSAGE);

  const { error } = await supabase.from('calculations').select('outputs').limit(1);
  if (error) {
    if (isMissingColumnError(error, 'outputs')) {
      outputsColumnAvailable = false;
      throw new Error(OUTPUTS_MISSING_MESSAGE);
    }
    throw error;
  }

  outputsColumnAvailable = true;
};

const toIsoStart = (dateValue?: string) => {
  if (!dateValue) return null;
  const dt = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
};

const toIsoEnd = (dateValue?: string) => {
  if (!dateValue) return null;
  const dt = new Date(`${dateValue}T23:59:59`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
};

export const saveResultRemote = async (entry: SaveEntry) => {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('Not signed in');

  await ensureOutputsColumn();

  const { data, error } = await supabase
    .from('calculations')
    .insert({
      user_id: uid,
      type: entry.type,
      label: entry.label,
      inputs: entry.inputs,
      outputs: entry.outputs ?? {},
      result: entry.result,
      unit: entry.unit,
    })
    .select()
    .single();

  if (error) {
    if (isMissingColumnError(error, 'outputs')) {
      throw new Error(OUTPUTS_MISSING_MESSAGE);
    }
    throw error;
  }
  return data;
};

export const getHistoryRemote = async (filters?: HistoryFilters): Promise<SavedResult[]> => {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('Not signed in');

  let query = supabase
    .from('calculations')
    .select('id,type,label,inputs,outputs,result,unit,created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  const fromIso = toIsoStart(filters?.fromDate);
  const toIso = toIsoEnd(filters?.toDate);
  if (fromIso) {
    query = query.gte('created_at', fromIso);
  }
  if (toIso) {
    query = query.lte('created_at', toIso);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingColumnError(error, 'outputs')) {
      throw new Error(OUTPUTS_MISSING_MESSAGE);
    }
    throw error;
  }

  return (data as any[]).map((row) => ({
    id: row.id,
    type: row.type as any,
    label: row.label,
    inputs: row.inputs ?? {},
    outputs: row.outputs ?? {},
    result: row.result,
    unit: row.unit,
    timestamp: new Date(row.created_at).getTime(),
  }));
};

export const deleteHistoryRemote = async (id: string) => {
  const { error } = await supabase.from('calculations').delete().eq('id', id);
  if (error) throw error;
};

export const clearHistoryRemote = async () => {
  // RLS will limit this to the current user
  const { error } = await supabase.from('calculations').delete().neq('id', '');
  if (error) throw error;
};
