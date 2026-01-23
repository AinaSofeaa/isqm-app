import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import type { Institution } from '../types';

type InstitutionPickerProps = {
  valueInstitutionId: string | null;
  onChange: (inst: Institution | null) => void;
  institutions?: Institution[];
  disabled?: boolean;
};

const CATEGORY_LABELS: Record<Institution['category'], string> = {
  UA: 'Universiti Awam',
  POLYTECHNIC: 'Politeknik',
  COMMUNITY_COLLEGE: 'Kolej Komuniti',
};

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ');

const getAcronym = (value: string) => {
  const match = value.match(/\(([^)]+)\)/);
  return match ? match[1] : '';
};

const useDebouncedValue = (value: string, delayMs: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      window.clearTimeout(handle);
    };
  }, [delayMs, value]);

  return debounced;
};

const highlightMatch = (text: string, query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const lower = text.toLowerCase();
  const needle = trimmed.toLowerCase();
  const start = lower.indexOf(needle);
  if (start === -1) return text;
  const end = start + trimmed.length;
  return (
    <>
      {text.slice(0, start)}
      <span className="bg-yellow-100 text-slate-900 font-bold">
        {text.slice(start, end)}
      </span>
      {text.slice(end)}
    </>
  );
};

const InstitutionPicker: React.FC<InstitutionPickerProps> = ({
  valueInstitutionId,
  onChange,
  institutions: institutionsProp,
  disabled,
}) => {
  const [localInstitutions, setLocalInstitutions] = useState<Institution[]>(institutionsProp ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const debouncedQuery = useDebouncedValue(query, 180);
  const normalizedQuery = normalizeText(debouncedQuery);
  const institutions = institutionsProp ?? localInstitutions;

  useEffect(() => {
    if (institutionsProp) {
      setLocalInstitutions(institutionsProp);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('institutions')
        .select('id, name, category, state')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (!active) return;
      if (fetchError) {
        setError('Could not load institutions. Please try again.');
        setLocalInstitutions([]);
      } else {
        setLocalInstitutions(data ?? []);
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [institutionsProp]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      if (event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const selectedInstitution = useMemo(() => {
    if (!valueInstitutionId) return null;
    return institutions.find((inst) => inst.id === valueInstitutionId) ?? null;
  }, [institutions, valueInstitutionId]);

  const popularInstitutions = useMemo(() => {
    if (!institutions.length) return [];
    const poly = institutions.filter((inst) => inst.category === 'POLYTECHNIC').slice(0, 8);
    const ua = institutions.filter((inst) => inst.category === 'UA').slice(0, 4);
    const cc = institutions.filter((inst) => inst.category === 'COMMUNITY_COLLEGE').slice(0, 4);
    return [...poly, ...ua, ...cc];
  }, [institutions]);

  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return institutions.filter((inst) => {
      const nameMatch = normalizeText(inst.name).includes(normalizedQuery);
      if (nameMatch) return true;
      const acronym = getAcronym(inst.name);
      if (!acronym) return false;
      return normalizeText(acronym).includes(normalizedQuery);
    });
  }, [institutions, normalizedQuery]);

  const totalMatches = normalizedQuery ? matches.length : popularInstitutions.length;
  const baseList = normalizedQuery ? matches : popularInstitutions;
  const limitedList = baseList.slice(0, 25);

  useEffect(() => {
    if (!isOpen) return;
    if (limitedList.length === 0) {
      setHighlightIndex(0);
      return;
    }
    setHighlightIndex((prev) => (prev >= limitedList.length ? 0 : prev));
  }, [isOpen, limitedList.length]);

  const handleSelect = (inst: Institution) => {
    onChange(inst);
    setQuery('');
    setIsOpen(false);
    setHighlightIndex(0);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setHighlightIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % Math.max(limitedList.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + Math.max(limitedList.length, 1)) % Math.max(limitedList.length, 1));
    } else if (event.key === 'Enter') {
      if (limitedList.length > 0) {
        event.preventDefault();
        const inst = limitedList[highlightIndex] ?? limitedList[0];
        if (inst) handleSelect(inst);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderMeta = (inst: Institution) => {
    const label = CATEGORY_LABELS[inst.category] ?? inst.category;
    return inst.state ? `${label} - ${inst.state}` : label;
  };

  const showNoResults = normalizedQuery && !loading && limitedList.length === 0;
  const showPopularLabel = !normalizedQuery && limitedList.length > 0;
  const showCount = normalizedQuery && matches.length > 25;
  const showEmptyList = !loading && !showNoResults && limitedList.length === 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="block">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Institusi (Cari nama politeknik/kolej komuniti/UA)
        </span>
        <div className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
          <Building2 size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!disabled) setIsOpen(true);
            }}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Contoh: PSA / Politeknik Sultan Salahuddin / UiTM"
            disabled={disabled}
            className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700"
          />
        </div>
      </label>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-lg z-30 overflow-hidden">
          {showPopularLabel && (
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Popular
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="px-4 py-4 text-sm font-semibold text-slate-500">
                Loading institutions...
              </div>
            )}

            {showNoResults && (
              <div className="px-4 py-4 text-sm font-semibold text-slate-500">
                No results. Try a different spelling.
              </div>
            )}

            {showEmptyList && (
              <div className="px-4 py-4 text-sm font-semibold text-slate-500">
                No institutions available yet.
              </div>
            )}

            {!loading && !showNoResults && limitedList.map((inst, index) => {
              const isActive = index === highlightIndex;
              return (
                <button
                  key={inst.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(inst);
                  }}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-800">
                    {highlightMatch(inst.name, debouncedQuery)}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    {renderMeta(inst)}
                  </div>
                </button>
              );
            })}
          </div>

          {showCount && (
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Showing 25 of {matches.length}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 text-[11px] font-semibold text-red-500">
          {error}
        </div>
      )}

      {valueInstitutionId && loading && (
        <div className="mt-3 h-10 w-48 rounded-2xl bg-slate-100 animate-pulse" />
      )}

      {valueInstitutionId && !loading && (
        <div className="mt-3 inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">
              {selectedInstitution ? selectedInstitution.name : 'Unknown institution'}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {selectedInstitution ? renderMeta(selectedInstitution) : 'Please select again.'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="p-1 rounded-full text-slate-500 hover:text-slate-700 hover:bg-white transition-colors disabled:opacity-50"
            aria-label="Clear institution"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default InstitutionPicker;
