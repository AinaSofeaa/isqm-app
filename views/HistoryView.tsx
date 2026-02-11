
import React, { useMemo, useState, useEffect } from 'react';
import { getHistoryRemote, getHistoryRemoteError, clearHistoryRemote, deleteHistoryRemote, type HistoryFilters } from '../services/historyService';
import { SavedResult } from '../types';
import { Trash2, Trash, History as HistoryIcon, Layers, Maximize, Columns, Grid } from 'lucide-react';
import { useI18n } from '../src/i18n/I18nContext';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { useFeedback } from '../contexts/FeedbackContext';

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDefaultFilters = (): HistoryFilters => {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 30);
  return {
    type: 'all',
    fromDate: formatDateInput(fromDate),
    toDate: formatDateInput(today),
  };
};

const HistoryView: React.FC = () => {
  const { lang, t } = useI18n();
  const [history, setHistory] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const { showSuccess, showError } = useFeedback();
  const [filters, setFilters] = useState<HistoryFilters>(() => buildDefaultFilters());

  const showLoadError = (detail: string) => {
    showError(t('modal.loadFailTitle'), t('modal.loadFailMsg', { error: detail }));
  };

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      setErrorKey(null);
      (async () => {
        try {
          const rows = await getHistoryRemote(filters);
          if (cancelled) return;
          setHistory(rows);
          const error = getHistoryRemoteError();
          if (error) {
            const detail = formatSupabaseError(error, '');
            const message = detail.toLowerCase();
            let key = 'history.loadFailed';
            if (message.includes('not signed in')) {
              key = 'common.errorSignInAgain';
            } else if (message.includes('outputs jsonb')) {
              key = 'common.dbMigrationRequired';
            }
            setErrorKey(key);
            const info = key === 'history.loadFailed' ? detail : t(key);
            if (info) showLoadError(info);
          } else {
            setErrorKey(null);
          }
        } catch (e: any) {
          if (!cancelled) {
            const detail = formatSupabaseError(e, t('common.errorTryAgain'));
            setErrorKey('history.loadFailed');
            showLoadError(detail);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [filters]);

  const handleClearAll = () => {
    if (window.confirm(t('history.clearConfirm'))) {
      (async () => {
        try {
          await clearHistoryRemote();
          setHistory([]);
          showSuccess(t('modal.deleteSuccessTitle'), t('modal.deleteSuccessMsg'));
        } catch (e: any) {
          const reason = formatSupabaseError(e, t('common.errorTryAgain'));
          showError(t('modal.deleteFailTitle'), t('modal.deleteFailMsg', { error: reason }));
        }
      })();
    }
  };

  const handleDeleteItem = (id: string) => {
    (async () => {
      try {
        await deleteHistoryRemote(id);
        setHistory((prev) => prev.filter((x) => x.id !== id));
        showSuccess(t('modal.deleteSuccessTitle'), t('modal.deleteSuccessMsg'));
      } catch (e: any) {
        const reason = formatSupabaseError(e, t('common.errorTryAgain'));
        showError(t('modal.deleteFailTitle'), t('modal.deleteFailMsg', { error: reason }));
      }
    })();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'beam': return <Maximize size={18} className="text-blue-500" />;
      case 'column': return <Columns size={18} className="text-orange-500" />;
      case 'slab': return <Layers size={18} className="text-emerald-500" />;
      case 'concrete': return <Layers size={18} className="text-blue-500" />;
      case 'formwork': return <Maximize size={18} className="text-orange-500" />;
      case 'rebar': return <Grid size={18} className="text-emerald-500" />;
      default: return <HistoryIcon size={18} />;
    }
  };

  const getResultDecimals = (item: SavedResult) => {
    if (item.type === 'rebar') return 0;
    if (item.type === 'concrete') return 3;
    if (item.type === 'formwork') return 2;
    if (item.type === 'slab' && item.unit === 'm2') return 3;
    return 2;
  };

  const getOutputItems = (item: SavedResult) => {
    const outputs = item.outputs;
    if (!outputs || typeof outputs !== 'object') return [];

    const meta: Record<string, { label: string; unit?: string; decimals: number }> = {
      concrete_m3: { label: t('history.outputConcrete'), unit: 'm3', decimals: 3 },
      formwork_m2: { label: t('history.outputFormwork'), unit: 'm2', decimals: 3 },
      soffit_m2: { label: t('history.outputSoffit'), unit: 'm2', decimals: 3 },
      form_to_side_m2: { label: t('history.outputFormToSide'), unit: 'm2', decimals: 3 },
      steel_kg: { label: t('history.outputSteel'), unit: 'kg', decimals: 2 },
      steel_main_kg: { label: t('history.outputSteelMain'), unit: 'kg', decimals: 2 },
      steel_links_kg: { label: t('history.outputSteelLinks'), unit: 'kg', decimals: 2 },
      steel_total_kg: { label: t('history.outputSteelTotal'), unit: 'kg', decimals: 2 },
      bars_qty: { label: t('history.outputBarsQty'), decimals: 2 },
      links_qty: { label: t('history.outputLinksQty'), decimals: 2 },
    };

    const orderMap: Record<string, string[]> = {
      beam: ['concrete_m3', 'formwork_m2', 'steel_kg'],
      slab: ['concrete_m3', 'formwork_m2', 'soffit_m2', 'form_to_side_m2', 'steel_kg', 'bars_qty'],
      column: ['concrete_m3', 'formwork_m2', 'steel_main_kg', 'steel_links_kg', 'steel_total_kg', 'links_qty'],
    };

    const order = orderMap[item.type] ?? Object.keys(outputs);
    return order
      .map((key) => {
        const value = (outputs as Record<string, unknown>)[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) return null;
        const metaItem = meta[key];
        const decimals = metaItem?.decimals ?? 2;
        return {
          key,
          label: metaItem?.label ?? key,
          value: value.toFixed(decimals),
          unit: metaItem?.unit ?? '',
        };
      })
      .filter((item) => item !== null) as Array<{ key: string; label: string; value: string; unit: string }>;
  };

  const typeOptions = useMemo(() => ([
    { value: 'all', label: t('common.all') },
    { value: 'beam', label: t('nav.beam') },
    { value: 'column', label: t('nav.column') },
    { value: 'slab', label: t('nav.slab') },
  ] as const), [t]);

  const handleClearFilters = () => {
    setFilters(buildDefaultFilters());
  };

  const formatDate = (ts: number) => {
    const locale = lang === 'ms' ? 'ms-MY' : 'en-MY';
    if (!Number.isFinite(ts)) return '--';
    return new Date(ts).toLocaleDateString(locale, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTypeLabel = (type: string) => {
    switch (type) {
      case 'beam':
        return t('history.typeBeam');
      case 'column':
        return t('history.typeColumn');
      case 'slab':
        return t('history.typeSlab');
      case 'concrete':
        return t('history.typeConcrete');
      case 'formwork':
        return t('history.typeFormwork');
      case 'rebar':
        return t('history.typeRebar');
      default:
        return type;
    }
  };

  const formatItemLabel = (item: SavedResult) => {
    switch (item.type) {
      case 'beam':
        return t('nav.beamTitle');
      case 'column':
        return t('nav.columnTitle');
      case 'slab':
        return t('nav.slabTitle');
      case 'concrete':
        return t('history.typeConcrete');
      case 'formwork':
        return t('history.typeFormwork');
      case 'rebar':
        return t('history.typeRebar');
      default:
        return item.label;
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">{t('history.recentRecords')}</h3>
        {history.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:bg-red-100 transition-colors"
          >
            <Trash size={14} /> {t('common.clearAll')}
          </button>
        )}
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 space-y-4">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('history.typeLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const active = filters.type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, type: option.value }))}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                    active
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                      : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {t('history.fromLabel')}
              <input
                type="date"
                value={filters.fromDate ?? ''}
                onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value }))}
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="flex flex-col text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {t('history.toLabel')}
              <input
                type="date"
                value={filters.toDate ?? ''}
                onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value }))}
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:text-slate-700"
          >
            {t('common.clear')}
          </button>
        </div>

        {!loading && !errorKey && (
          <div className="text-[11px] font-semibold text-slate-500">
            {t('history.showingCount', { count: history.length })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin" />
          <p className="mt-4 font-medium">{t('history.loadingTitle')}</p>
          <p className="text-xs text-slate-400">{t('history.loadingSubtitle')}</p>
        </div>
      ) : (
        <>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <HistoryIcon size={64} strokeWidth={1} />
              <p className="mt-4 font-medium">{t('history.emptyTitle')}</p>
              <p className="text-xs text-slate-400">{t('history.emptySubtitle')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const outputs = getOutputItems(item);
                const inputs = item.inputs && typeof item.inputs === 'object' ? item.inputs : {};
                const safeResult = Number.isFinite(item.result) ? item.result : null;
                const safeUnit = typeof item.unit === 'string' ? item.unit : '';
                return (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative group overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          {getIcon(item.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{formatItemLabel(item)}</h4>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                            {formatDate(item.timestamp)} | {formatTypeLabel(item.type)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-800">
                          {safeResult === null ? '--' : safeResult.toFixed(getResultDecimals(item))}
                          {safeUnit ? <span className="text-xs font-bold text-slate-400 ml-1">{safeUnit}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      {Object.entries(inputs).map(([k, v]) => (
                        <span key={k} className="bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase">
                          {k}: {v}
                        </span>
                      ))}
                    </div>

                    {outputs.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {t('history.outputsLabel')}
                        </div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {outputs.map((output) => (
                            <span
                              key={output.key}
                              className="bg-blue-50/60 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 uppercase"
                            >
                              {output.label}: {output.value}{output.unit ? ` ${output.unit}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute right-0 top-0 h-full bg-red-50 text-red-500 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:bg-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryView;

