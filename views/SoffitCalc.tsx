import React, { useEffect, useState } from 'react';
import { RotateCcw, Save, LayoutTemplate } from 'lucide-react';
import CalcField from '../components/CalcField';
import PageSavedHistorySection from '../components/PageSavedHistorySection';
import SaveMetaFields from '../components/SaveMetaFields';
import { useFeedback } from '../contexts/FeedbackContext';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { saveResultRemote } from '../services/historyService';
import { useI18n } from '../src/i18n/I18nContext';
import type { SavedResult } from '../types';

const readInputValue = (item: SavedResult, key: string) => {
  const value = item.inputs?.[key];
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  return '';
};

const SoffitCalc: React.FC = () => {
  const { t } = useI18n();
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [sides, setSides] = useState('1');
  const [edges, setEdges] = useState('1');
  const [projectLocation, setProjectLocation] = useState('');
  const [referenceRemark, setReferenceRemark] = useState('');
  const [total, setTotal] = useState(0);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const { showSuccess, showError } = useFeedback();

  useEffect(() => {
    const p = Number(length);
    const l = Number(width);
    const tVal = Number(thickness);
    const s = Number(sides);
    const e = Number(edges);
    const safeP = Number.isFinite(p) ? p : 0;
    const safeL = Number.isFinite(l) ? l : 0;
    const safeT = Number.isFinite(tVal) ? tVal : 0;
    const safeS = Number.isFinite(s) ? s : 0;
    const safeE = Number.isFinite(e) ? e : 0;
    const area = (safeP * safeL) + (safeP * safeT * safeS) + (safeL * safeT * safeE);
    setTotal(area);
  }, [edges, length, sides, thickness, width]);

  const showValidation = () => {
    showError(t('modal.validationTitle'), t('modal.validationMsg'));
  };

  const hasValidInputs = () => {
    const p = Number(length);
    const l = Number(width);
    const tVal = Number(thickness);
    const s = Number(sides);
    const e = Number(edges);
    if (!Number.isFinite(p) || p <= 0) return false;
    if (!Number.isFinite(l) || l <= 0) return false;
    if (!Number.isFinite(tVal) || tVal <= 0) return false;
    if (!Number.isFinite(s) || !Number.isInteger(s) || s < 1) return false;
    if (!Number.isFinite(e) || !Number.isInteger(e) || e < 1) return false;
    return true;
  };

  const handleReset = () => {
    setLength('');
    setWidth('');
    setThickness('');
    setSides('1');
    setEdges('1');
    setProjectLocation('');
    setReferenceRemark('');
  };

  const handleSave = async () => {
    if (!hasValidInputs()) {
      showValidation();
      return;
    }

    try {
      await saveResultRemote({
        type: 'slab',
        label: `${t('history.typeSlab')} ${t('calc.soffit_reinforcement')}`,
        contextKey: 'slab-soffit',
        projectLocation,
        referenceRemark,
        inputs: {
          length: parseFloat(length),
          width: parseFloat(width),
          thickness: parseFloat(thickness),
          sides: parseFloat(sides),
          edges: parseFloat(edges),
        },
        outputs: {
          soffit_m2: total,
        },
        result: total,
        unit: 'm2'
      });
      setHistoryRefreshKey((prev) => prev + 1);
      showSuccess(t('modal.saveSuccessTitle'), t('modal.saveSuccessMsg'));
    } catch (error: any) {
      const reason = formatSupabaseError(error, t('common.errorTryAgain'));
      showError(t('modal.saveFailTitle'), t('modal.saveFailMsg', { error: reason }));
    }
  };

  const handleReuse = (item: SavedResult) => {
    setLength(readInputValue(item, 'length'));
    setWidth(readInputValue(item, 'width'));
    setThickness(readInputValue(item, 'thickness'));
    setSides(readInputValue(item, 'sides') || '1');
    setEdges(readInputValue(item, 'edges') || '1');
    setProjectLocation(item.projectLocation ?? '');
    setReferenceRemark(item.referenceRemark ?? '');
  };

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <header className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-2.5 rounded-lg text-orange-600">
            <LayoutTemplate size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">{t('calc.soffit_reinforcement')}</h2>
            <p className="text-xs text-slate-400">{t('calc.formulaSoffitTotal')}</p>
          </div>
        </header>

        <CalcField label={t('calc.slab.lengthLabel')} value={length} onChange={setLength} placeholder="0.00" />
        <CalcField label={t('calc.slab.widthLabel')} value={width} onChange={setWidth} placeholder="0.00" />
        <CalcField label={t('calc.slab.thicknessLabel')} value={thickness} onChange={setThickness} placeholder="0.00" />
        <CalcField label={t('legacy.formwork.sidesLabel')} value={sides} onChange={setSides} placeholder="1" unit="ea" />
        <CalcField label={t('calc.soffitEdgesLabel')} value={edges} onChange={setEdges} placeholder="1" unit="ea" />

        <SaveMetaFields
          projectLocation={projectLocation}
          referenceRemark={referenceRemark}
          onProjectLocationChange={setProjectLocation}
          onReferenceRemarkChange={setReferenceRemark}
        />

        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-medium">{t('legacy.formwork.totalArea')}</span>
            <div className="text-right">
              <span className="text-4xl font-black text-orange-600">{total.toFixed(2)}</span>
              <span className="text-lg font-bold text-orange-400 ml-1">m2</span>
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
              disabled={total === 0}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-95 transition-all ${
                total > 0
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed'
              }`}
            >
              <><Save size={18} /> {t('common.save')}</>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100">
        <h3 className="font-bold text-orange-800 text-sm mb-2">{t('legacy.formwork.didYouKnowTitle')}</h3>
        <p className="text-orange-700/70 text-sm leading-relaxed">
          {t('legacy.formwork.didYouKnowBody')}
        </p>
      </div>

      <PageSavedHistorySection
        type="slab"
        contextKey="slab-soffit"
        refreshKey={historyRefreshKey}
        onReuse={handleReuse}
      />
    </div>
  );
};

export default SoffitCalc;
