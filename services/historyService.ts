import { supabase } from './supabaseClient';
import type { SavedResult } from '../types';

// Maps DB rows to SavedResult used by the UI.
type DbRow = {
  id: string;
  type: string;
  label: string;
  inputs: Record<string, number>;
  result: number;
  unit: string;
  created_at: string;
};

export const saveResultRemote = async (entry: Omit<SavedResult, 'id' | 'timestamp'>) => {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('calculations')
    .insert({
      user_id: uid,
      type: entry.type,
      label: entry.label,
      inputs: entry.inputs,
      result: entry.result,
      unit: entry.unit,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getHistoryRemote = async (): Promise<SavedResult[]> => {
  const { data, error } = await supabase
    .from('calculations')
    .select('id,type,label,inputs,result,unit,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data as DbRow[]).map((row) => ({
    id: row.id,
    type: row.type as any,
    label: row.label,
    inputs: row.inputs ?? {},
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
