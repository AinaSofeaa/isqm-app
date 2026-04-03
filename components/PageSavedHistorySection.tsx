import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, RotateCcw, Trash2 } from 'lucide-react';
import { useFeedback } from '../contexts/FeedbackContext';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { deleteHistoryRemote, getHistoryRemote } from '../services/historyService';
import { useI18n } from '../src/i18n/I18nContext';
import type { SavedResult } from '../types';

type PageSavedHistorySectionProps = {
  type: 'beam' | 'column' | 'slab';
  contextKey: string;
  refreshKey?: number;
  onReuse?: (item: SavedResult) => void;
};

const formatValue = (value: unknown) => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '--';
    const fixed = Number.isInteger(value) ? value.toString() : value.toFixed(3);
    return fixed.replace(/\.?0+$/, '');
  }

  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null || value === undefined) return '--';
  return JSON.stringify(value);
};

const PageSavedHistorySection: React.FC<PageSavedHistorySectionProps> = ({
  type,
  contextKey,
  refreshKey = 0,
  onReuse,
}) => {
  const { lang, t } = useI18n();
  const { showSuccess, showError } = useFeedback();
  const [history, setHistory] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const rows = await getHistoryRemote({ type, contextKey, limit: 40 });
        if (!cancelled) {
          setHistory(rows);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [contextKey, refreshKey, type]);

  const formatDate = (timestamp: number) => {
    const locale = lang === 'ms' ? 'ms-MY' : 'en-MY';
    return new Date(timestamp).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryRemote(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      showSuccess(t('modal.deleteSuccessTitle'), t('modal.deleteSuccessMsg'));
    } catch (error: any) {
      const reason = formatSupabaseError(error, t('common.errorTryAgain'));
      showError(t('modal.deleteFailTitle'), t('modal.deleteFailMsg', { error: reason }));
    }
  };

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 text-slate-700 font-semibold">
        <HistoryIcon size={16} className="text-slate-500" />
        {t('history.savedHistoryTitle')}
      </div>

      {loading ? (
        <div className="mt-4 text-sm font-medium text-slate-400">{t('common.loading')}</div>
      ) : history.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-400">
          {t('history.noSavedHistory')}
        </div>
      ) : (
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {history.map((item) => {
            const inputEntries = Object.entries(item.inputs ?? {});
            const outputEntries = Object.entries(item.outputs ?? {}).filter(([, value]) => (
              typeof value === 'number' && Number.isFinite(value as number)
            ));

            return (
              <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.label}</h4>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('history.savedOnLabel')}: {formatDate(item.timestamp)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-slate-800">
                      {formatValue(item.result)}
                      {item.unit ? <span className="ml-1 text-[11px] font-bold text-slate-400">{item.unit}</span> : null}
                    </div>
                  </div>
                </div>

                {item.projectLocation ? (
                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    {t('history.projectLocationLabel')}: <span className="font-medium text-slate-500">{item.projectLocation}</span>
                  </p>
                ) : null}

                {item.referenceRemark ? (
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {t('history.referenceRemarkLabel')}: <span className="font-medium text-slate-500">{item.referenceRemark}</span>
                  </p>
                ) : null}

                {inputEntries.length > 0 ? (
                  <div className="mt-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t('history.inputsLabel')}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {inputEntries.map(([key, value]) => (
                        <span key={key} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500 shadow-sm">
                          {key}: {formatValue(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {outputEntries.length > 0 ? (
                  <div className="mt-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t('history.resultsLabel')}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {outputEntries.map(([key, value]) => (
                        <span key={key} className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">
                          {key}: {formatValue(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  {onReuse ? (
                    <button
                      type="button"
                      onClick={() => onReuse(item)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:text-slate-800"
                    >
                      <RotateCcw size={14} />
                      {t('common.reuse')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                    {t('common.delete')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PageSavedHistorySection;
