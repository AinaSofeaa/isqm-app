import React, { useEffect, useState } from 'react';
import { RotateCcw, Save, Calculator } from 'lucide-react';
import CalcField from '../components/CalcField';
import PageSavedHistorySection from '../components/PageSavedHistorySection';
import SaveMetaFields from '../components/SaveMetaFields';
import { useFeedback } from '../contexts/FeedbackContext';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { saveResultRemote } from '../services/historyService';
import { useI18n } from '../src/i18n/I18nContext';
import type { SavedResult } from '../types';

const parseInput = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const readInputValue = (item: SavedResult, key: string) => {
  const value = item.inputs?.[key];
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  return '';
};

const ColumnConcreteView: React.FC = () => {
  const { t } = useI18n();
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [bilangan, setBilangan] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [referenceRemark, setReferenceRemark] = useState('');
  const [oneColumnVolume, setOneColumnVolume] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const { showSuccess, showError } = useFeedback();

  useEffect(() => {
    const nextOneColumnVolume = parseInput(length) * parseInput(width) * parseInput(height);
    const nextTotalVolume = nextOneColumnVolume * parseInput(bilangan);
    setOneColumnVolume(nextOneColumnVolume);
    setTotalVolume(nextTotalVolume);
  }, [bilangan, height, length, width]);

  const showValidation = () => {
    showError(t('modal.validationTitle'), t('modal.validationMsg'));
  };

  const handleReset = () => {
    setLength('');
    setWidth('');
    setHeight('');
    setBilangan('');
    setProjectLocation('');
    setReferenceRemark('');
  };

  const handleSave = async () => {
    if (totalVolume <= 0) {
      showValidation();
      return;
    }

    try {
      await saveResultRemote({
        type: 'column',
        label: `${t('history.typeColumn')} ${t('calc.concrete')}`,
        contextKey: 'column-concrete',
        projectLocation,
        referenceRemark,
        inputs: {
          length_m: parseInput(length),
          width_m: parseInput(width),
          height_m: parseInput(height),
          bilangan: parseInput(bilangan),
        },
        outputs: {
          concrete_m3: oneColumnVolume,
          concrete_total_m3: totalVolume,
        },
        result: totalVolume,
        unit: 'm3',
      });
      setHistoryRefreshKey((prev) => prev + 1);
      showSuccess(t('modal.saveSuccessTitle'), t('modal.saveSuccessMsg'));
    } catch (error: any) {
      const reason = formatSupabaseError(error, t('common.errorTryAgain'));
      showError(t('modal.saveFailTitle'), t('modal.saveFailMsg', { error: reason }));
    }
  };

  const handleReuse = (item: SavedResult) => {
    setLength(readInputValue(item, 'length_m'));
    setWidth(readInputValue(item, 'width_m'));
    setHeight(readInputValue(item, 'height_m'));
    setBilangan(readInputValue(item, 'bilangan'));
    setProjectLocation(item.projectLocation ?? '');
    setReferenceRemark(item.referenceRemark ?? '');
  };

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <header className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">{t('calc.concrete')}</h2>
            <p className="text-xs text-slate-400">{t('legacy.concrete.formula')}</p>
          </div>
        </header>

        <CalcField label={t('legacy.concrete.lengthLabel')} value={length} onChange={setLength} placeholder="0.00" />
        <CalcField label={t('legacy.concrete.widthLabel')} value={width} onChange={setWidth} placeholder="0.00" />
        <CalcField label={t('legacy.concrete.heightLabel')} value={height} onChange={setHeight} placeholder="0.00" />
        <CalcField label={t('calc.bilanganLabel')} value={bilangan} onChange={setBilangan} placeholder="0" unit="ea" />

        <SaveMetaFields
          projectLocation={projectLocation}
          referenceRemark={referenceRemark}
          onProjectLocationChange={setProjectLocation}
          onReferenceRemarkChange={setReferenceRemark}
        />

        <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-slate-400 font-medium">{t('calc.columnConcreteOneLabel')}</span>
            <div className="text-right">
              <span className="text-4xl font-black text-blue-700">{oneColumnVolume.toFixed(3)}</span>
              <span className="text-lg font-bold text-blue-400 ml-1">m3</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">{t('legacy.concrete.formula')}</p>

          <div className="flex justify-between items-end pt-4 border-t border-slate-100">
            <span className="text-slate-400 font-medium">{t('calc.columnConcreteTotalLabel')}</span>
            <div className="text-right">
              <span className="text-4xl font-black text-blue-700">{totalVolume.toFixed(3)}</span>
              <span className="text-lg font-bold text-blue-400 ml-1">m3</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">{t('calc.formulaColumnConcreteTotal')}</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold active:scale-95 transition-transform"
            >
              <RotateCcw size={18} />
              {t('common.reset')}
            </button>
            <button
              onClick={handleSave}
              disabled={totalVolume === 0}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-95 transition-all ${
                totalVolume > 0
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed'
              }`}
            >
              <><Save size={18} /> {t('common.save')}</>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
        <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
          {t('legacy.concrete.learningNoteTitle')}
        </h3>
        <p className="text-blue-700/70 text-sm leading-relaxed">{t('legacy.concrete.learningNoteBody')}</p>
      </div>

      <PageSavedHistorySection
        type="column"
        contextKey="column-concrete"
        refreshKey={historyRefreshKey}
        onReuse={handleReuse}
      />
    </div>
  );
};

export default ColumnConcreteView;
