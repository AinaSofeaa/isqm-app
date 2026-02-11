
import React, { useState, useEffect } from 'react';
import CalcField from '../components/CalcField';
import { RotateCcw, Save, Calculator } from 'lucide-react';
import { saveResultRemote } from '../services/historyService';
import { useI18n } from '../src/i18n/I18nContext';
import type { CalculationType } from '../types';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { useFeedback } from '../contexts/FeedbackContext';

type ConcreteCalcProps = {
  entryType?: CalculationType;
  entryLabel?: string;
  outputKey?: string;
};

const ConcreteCalc: React.FC<ConcreteCalcProps> = ({ entryType, entryLabel, outputKey }) => {
  const { t } = useI18n();
  const resolvedLabel = entryLabel ?? t('calc.concrete');
  const resolvedType = entryType ?? 'concrete';
  const resolvedOutputKey = outputKey ?? 'concrete_m3';
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [volume, setVolume] = useState<number>(0);
  const { showSuccess, showError } = useFeedback();

  useEffect(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    setVolume(l * w * h);
  }, [length, width, height]);

  const showValidation = () => {
    showError(t('modal.validationTitle'), t('modal.validationMsg'));
  };

  const handleReset = () => {
    setLength('');
    setWidth('');
    setHeight('');
  };

  const handleSave = async () => {
    if (volume <= 0) {
      showValidation();
      return;
    }
    try {
      const outputs = resolvedOutputKey ? { [resolvedOutputKey]: volume } : undefined;
      await saveResultRemote({
        type: resolvedType,
        label: resolvedLabel,
        inputs: { length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) },
        outputs,
        result: volume,
        unit: 'm³'
      });
      showSuccess(t('modal.saveSuccessTitle'), t('modal.saveSuccessMsg'));
    } catch (e: any) {
      const reason = formatSupabaseError(e, t('common.errorTryAgain'));
      showError(t('modal.saveFailTitle'), t('modal.saveFailMsg', { error: reason }));
    }
  };

  return (
    <div className="p-5">
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

        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-medium">{t('legacy.concrete.totalVolume')}</span>
            <div className="text-right">
              <span className="text-4xl font-black text-blue-700">{volume.toFixed(3)}</span>
              <span className="text-lg font-bold text-blue-400 ml-1">m³</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold active:scale-95 transition-transform"
            >
              <RotateCcw size={18} />
              {t('common.reset')}
            </button>
            <button
              onClick={handleSave}
              disabled={volume === 0}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-95 transition-all ${
                volume > 0 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed'
              }`}
            >
              <><Save size={18} /> {t('common.save')}</>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
        <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
           {t('legacy.concrete.learningNoteTitle')}
        </h3>
        <p className="text-blue-700/70 text-sm leading-relaxed">{t('legacy.concrete.learningNoteBody')}</p>
      </div>
    </div>
  );
};

export default ConcreteCalc;








