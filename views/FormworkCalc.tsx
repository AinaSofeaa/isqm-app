
import React, { useState, useEffect } from 'react';
import CalcField from '../components/CalcField';
import { RotateCcw, Save, LayoutTemplate } from 'lucide-react';
import { saveResultRemote } from '../services/historyService';
import { useI18n } from '../src/i18n/I18nContext';
import type { CalculationType } from '../types';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { useFeedback } from '../contexts/FeedbackContext';

type FormworkCalcProps = {
  title?: string;
  formula?: string;
  entryType?: CalculationType;
  entryLabel?: string;
  outputKey?: string;
};

const FormworkCalc: React.FC<FormworkCalcProps> = ({ title, formula, entryType, entryLabel, outputKey }) => {
  const { t } = useI18n();
  const resolvedTitle = title ?? t('calc.formwork');
  const resolvedFormula = formula ?? t('legacy.formwork.formula');
  const resolvedLabel = entryLabel ?? resolvedTitle;
  const resolvedType = entryType ?? 'formwork';
  const resolvedOutputKey = outputKey ?? 'formwork_m2';
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [sides, setSides] = useState('1');
  const [area, setArea] = useState<number>(0);
  const { showSuccess, showError } = useFeedback();

  useEffect(() => {
    const l = parseFloat(length) || 0;
    const h = parseFloat(height) || 0;
    const s = parseFloat(sides) || 0;
    setArea(l * h * s);
  }, [length, height, sides]);

  const showValidation = () => {
    showError(t('modal.validationTitle'), t('modal.validationMsg'));
  };

  const handleReset = () => {
    setLength('');
    setHeight('');
    setSides('1');
  };

  const handleSave = async () => {
    if (area <= 0) {
      showValidation();
      return;
    }
    try {
      const outputs = resolvedOutputKey ? { [resolvedOutputKey]: area } : undefined;
      await saveResultRemote({
        type: resolvedType,
        label: resolvedLabel,
        inputs: { length: parseFloat(length), height: parseFloat(height), sides: parseFloat(sides) },
        outputs,
        result: area,
        unit: 'm²'
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
          <div className="bg-orange-100 p-2.5 rounded-lg text-orange-600">
            <LayoutTemplate size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">{resolvedTitle}</h2>
            <p className="text-xs text-slate-400">{resolvedFormula}</p>
          </div>
        </header>

        <CalcField label={t('legacy.formwork.lengthLabel')} value={length} onChange={setLength} placeholder="0.00" />
        <CalcField label={t('legacy.formwork.heightLabel')} value={height} onChange={setHeight} placeholder="0.00" />
        <CalcField label={t('legacy.formwork.sidesLabel')} value={sides} onChange={setSides} placeholder="1" unit="ea" />

        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-medium">{t('legacy.formwork.totalArea')}</span>
            <div className="text-right">
              <span className="text-4xl font-black text-orange-600">{area.toFixed(2)}</span>
              <span className="text-lg font-bold text-orange-400 ml-1">m²</span>
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
              disabled={area === 0}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-95 transition-all ${
                area > 0 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed'
              }`}
            >
              <><Save size={18} /> {t('common.save')}</>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-orange-50/50 rounded-2xl p-5 border border-orange-100">
        <h3 className="font-bold text-orange-800 text-sm mb-2">{t('legacy.formwork.didYouKnowTitle')}</h3>
        <p className="text-orange-700/70 text-sm leading-relaxed">
          {t('legacy.formwork.didYouKnowBody')}
        </p>
      </div>
    </div>
  );
};

export default FormworkCalc;



