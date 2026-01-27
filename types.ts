
export type CalculationType = 'beam' | 'column' | 'slab' | 'concrete' | 'formwork' | 'rebar';

export interface SavedResult {
  id: string;
  type: CalculationType;
  timestamp: number;
  label: string;
  inputs: Record<string, number>;
  outputs?: Record<string, unknown>;
  result: number;
  unit: string;
}

export interface CalculatorState {
  length: string;
  width: string;
  height: string;
  sides: string;
  spacing: string;
  areaLength: string;
}

export type InstitutionCategory = 'UA' | 'POLYTECHNIC' | 'COMMUNITY_COLLEGE';

export interface Institution {
  id: string;
  name: string;
  category: InstitutionCategory;
  state: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
  institution: string | null;
  user_type: 'student' | 'worker' | null;
  institution_id: string | null;
  company_name: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
}
