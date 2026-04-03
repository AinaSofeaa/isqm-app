import React, { useMemo, useState } from 'react';
import { Calculator, Grid3X3, Save } from 'lucide-react';
import PageSavedHistorySection from '../components/PageSavedHistorySection';
import QMField from '../components/QMField';
import SaveMetaFields from '../components/SaveMetaFields';
import { useFeedback } from '../contexts/FeedbackContext';
import { getFieldState } from '../lib/fieldState';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { saveResultRemote } from '../services/historyService';
import { useI18n } from '../src/i18n/I18nContext';
import { calcColumnQM, type ColumnInputs, type ColumnQMResult } from '../src/lib/qm';
import type { SavedResult } from '../types';

type ColumnMode = 'main-bars' | 'links';

type ColumnViewProps = {
  mode: ColumnMode;
};

type ColumnForm = {
  a: string;
  b: string;
  H: string;
  n: string;
  C: string;
  c: string;
  d: string;
  spacing: string;
  bilangan: string;
};

const initialForm: ColumnForm = {
  a: '',
  b: '',
  H: '',
  n: '',
  C: '',
  c: '',
  d: '',
  spacing: '',
  bilangan: '',
};

const formatNumber = (value: number | null | undefined, decimals: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
};

const parseNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, num) : 0;
};

const readInputValue = (item: SavedResult, key: string) => {
  const value = item.inputs?.[key];
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  return '';
};

const ColumnView: React.FC<ColumnViewProps> = ({ mode }) => {
  const { t } = useI18n();
  const [form, setForm] = useState<ColumnForm>(initialForm);
  const [projectLocation, setProjectLocation] = useState('');
  const [referenceRemark, setReferenceRemark] = useState('');
  const [touched, setTouched] = useState({
    a: false,
    b: false,
    H: false,
    n: false,
    C: false,
    c: false,
    d: false,
    spacing: false,
    bilangan: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ColumnQMResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const { showSuccess, showError } = useFeedback();

  const validateNonNegative = (value: string) => {
    if (!value.trim()) return null;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return t('calc.validationNonNegative');
    return null;
  };

  const validateNonNegativeInt = (value: string) => {
    if (!value.trim()) return null;
    const num = Number(value);
    if (!Number.isFinite(num) || !Number.isInteger(num)) return t('calc.validationInteger');
    if (num < 0) return t('calc.validationNonNegative');
    return null;
  };

  const errors = useMemo(() => ({
    a: validateNonNegative(form.a),
    b: validateNonNegative(form.b),
    H: validateNonNegative(form.H),
    n: validateNonNegativeInt(form.n),
    C: validateNonNegative(form.C),
    c: validateNonNegative(form.c),
    d: validateNonNegative(form.d),
    spacing: validateNonNegative(form.spacing),
    bilangan: validateNonNegativeInt(form.bilangan),
  }), [form, t]);

  const states = {
    a: getFieldState({ value: form.a, validator: validateNonNegative, touched: touched.a, submitted }),
    b: getFieldState({ value: form.b, validator: validateNonNegative, touched: touched.b, submitted }),
    H: getFieldState({ value: form.H, validator: validateNonNegative, touched: touched.H, submitted }),
    n: getFieldState({ value: form.n, validator: validateNonNegativeInt, touched: touched.n, submitted }),
    C: getFieldState({ value: form.C, validator: validateNonNegative, touched: touched.C, submitted }),
    c: getFieldState({ value: form.c, validator: validateNonNegative, touched: touched.c, submitted }),
    d: getFieldState({ value: form.d, validator: validateNonNegative, touched: touched.d, submitted }),
    spacing: getFieldState({ value: form.spacing, validator: validateNonNegative, touched: touched.spacing, submitted }),
    bilangan: getFieldState({ value: form.bilangan, validator: validateNonNegativeInt, touched: touched.bilangan, submitted }),
  };

  const hasErrors = Object.values(errors).some((error) => !!error);

  const showValidation = () => {
    showError(t('modal.validationTitle'), t('modal.validationMsg'));
  };

  const buildInputs = (): ColumnInputs => ({
    a: parseNumber(form.a),
    b: parseNumber(form.b),
    H: parseNumber(form.H),
    n: parseNumber(form.n),
    C: parseNumber(form.C),
    c: parseNumber(form.c),
    d: parseNumber(form.d),
    spacing: parseNumber(form.spacing),
  });

  const getBilangan = () => parseNumber(form.bilangan);

  const computeResult = () => {
    setSubmitted(true);
    if (hasErrors) {
      setResult(null);
      return null;
    }

    const nextResult = calcColumnQM(buildInputs());
    setResult(nextResult);
    return nextResult;
  };

  const handleCalculate = () => {
    if (!computeResult()) {
      showValidation();
    }
  };

  const getMainBarsTotal = (nextResult: ColumnQMResult | null) => (nextResult?.main_bars_m ?? 0) * getBilangan();
  const getLinksOverallTotal = (nextResult: ColumnQMResult | null) => (nextResult?.links_total_m ?? 0) * getBilangan();

  const handleSave = async () => {
    const computed = computeResult();
    const resultToSave = mode === 'main-bars' ? getMainBarsTotal(computed) : getLinksOverallTotal(computed);

    if (!computed || resultToSave <= 0) {
      showValidation();
      return;
    }

    setSaving(true);
    try {
      const inputs = buildInputs();
      const bilangan = getBilangan();

      if (mode === 'main-bars') {
        await saveResultRemote({
          type: 'column',
          label: `${t('history.typeColumn')} ${t('calc.mainBars')}`,
          contextKey: 'column-main-bars',
          projectLocation,
          referenceRemark,
          inputs: {
            H_m: inputs.H,
            n: inputs.n,
            C_m: inputs.C,
            bilangan,
          },
          outputs: {
            main_bars_m: computed.main_bars_m,
            main_bars_total_m: getMainBarsTotal(computed),
          },
          result: getMainBarsTotal(computed),
          unit: 'm',
        });
      } else {
        await saveResultRemote({
          type: 'column',
          label: `${t('history.typeColumn')} ${t('calc.links')}`,
          contextKey: 'column-link',
          projectLocation,
          referenceRemark,
          inputs: {
            a_m: inputs.a,
            b_m: inputs.b,
            H_m: inputs.H,
            c_m: inputs.c,
            d_mm: inputs.d,
            spacing_m: inputs.spacing,
            bilangan,
          },
          outputs: {
            link_length_m: computed.link_length_m,
            links_qty: computed.links_qty,
            links_total_m: computed.links_total_m,
            links_total_overall_m: getLinksOverallTotal(computed),
          },
          result: getLinksOverallTotal(computed),
          unit: 'm',
        });
      }

      setHistoryRefreshKey((prev) => prev + 1);
      showSuccess(t('modal.saveSuccessTitle'), t('modal.saveSuccessMsg'));
    } catch (error: any) {
      const reason = formatSupabaseError(error, t('common.errorTryAgain'));
      showError(t('modal.saveFailTitle'), t('modal.saveFailMsg', { error: reason }));
    } finally {
      setSaving(false);
    }
  };

  const canSave = mode === 'main-bars'
    ? !!result && getMainBarsTotal(result) > 0 && !saving
    : !!result && getLinksOverallTotal(result) > 0 && !saving;

  const handleReuse = (item: SavedResult) => {
    if (mode === 'main-bars') {
      setForm((prev) => ({
        ...prev,
        H: readInputValue(item, 'H_m'),
        n: readInputValue(item, 'n'),
        C: readInputValue(item, 'C_m'),
        bilangan: readInputValue(item, 'bilangan'),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        a: readInputValue(item, 'a_m'),
        b: readInputValue(item, 'b_m'),
        H: readInputValue(item, 'H_m'),
        c: readInputValue(item, 'c_m'),
        d: readInputValue(item, 'd_mm'),
        spacing: readInputValue(item, 'spacing_m'),
        bilangan: readInputValue(item, 'bilangan'),
      }));
    }

    setProjectLocation(item.projectLocation ?? '');
    setReferenceRemark(item.referenceRemark ?? '');
  };

  const renderField = (
    key: keyof ColumnForm,
    label: string,
    unit: string,
    options?: { step?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }
  ) => (
    <QMField
      label={label}
      value={form[key]}
      onChange={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
      onBlur={() => setTouched((prev) => ({ ...prev, [key]: true }))}
      unit={unit}
      errorMessage={errors[key]}
      showError={states[key].showError}
      showSuccess={states[key].showSuccess}
      step={options?.step}
      inputMode={options?.inputMode}
    />
  );

  const renderInputs = () => {
    if (mode === 'main-bars') {
      return (
        <div className="space-y-4">
          {renderField('H', t('calc.column.heightHLabel'), 'm')}
          {renderField('n', t('calc.mainBarsCountLabel'), t('common.barsUnit'), { step: '1', inputMode: 'numeric' })}
          {renderField('C', t('calc.mainBarsDeductionLabel'), 'm')}
          {renderField('bilangan', t('calc.bilanganLabel'), 'ea', { step: '1', inputMode: 'numeric' })}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {renderField('a', t('calc.column.sideALabel'), 'm')}
        {renderField('b', t('calc.column.sideBLabel'), 'm')}
        {renderField('H', t('calc.column.heightHLabel'), 'm')}
        {renderField('c', t('calc.linkCoverLabel'), 'm')}
        {renderField('d', t('calc.linkDiameterLabel'), 'mm')}
        {renderField('spacing', t('calc.spacingLabel'), 'm')}
        {renderField('bilangan', t('calc.bilanganLabel'), 'ea', { step: '1', inputMode: 'numeric' })}
      </div>
    );
  };

  const renderResultCard = () => {
    if (mode === 'main-bars') {
      return (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Grid3X3 size={16} className="text-orange-500" />
            {t('calc.mainBars')}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>{t('calc.mainBarsOneColumnLabel')}</span>
              <span className="text-base font-black text-orange-600">{formatNumber(result?.main_bars_m ?? null, 2)} m</span>
            </div>
            <p className="text-xs text-slate-400">{t('calc.formulaColumnSteelMain')}</p>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>{t('calc.mainBarsTotalLabel')}</span>
              <span className="text-base font-black text-orange-700">{formatNumber(getMainBarsTotal(result), 2)} m</span>
            </div>
            <p className="text-xs text-slate-400">{t('calc.formulaColumnMainBarsTotal')}</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-4 rounded-2xl font-black active:scale-95 transition-transform ${
              canSave ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="inline-flex items-center gap-2"><Save size={18} /> {t('common.save')}</span>
          </button>
        </section>
      );
    }

    return (
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Grid3X3 size={16} className="text-amber-500" />
          {t('calc.links')}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.oneLinkLengthLabel')}</span>
            <span className="text-base font-black text-amber-600">{formatNumber(result?.link_length_m ?? null, 2)} m</span>
          </div>
          <p className="text-xs text-slate-400">{t('calc.formulaColumnSteelLinks')}</p>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.linksQtyOneColumnLabel')}</span>
            <span className="text-base font-black text-amber-600">{formatNumber(result?.links_qty ?? null, 2)}</span>
          </div>
          <p className="text-xs text-slate-400">{t('calc.formulaColumnLinksQty')}</p>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.linksOneColumnTotalLabel')}</span>
            <span className="text-base font-black text-amber-700">{formatNumber(result?.links_total_m ?? null, 2)} m</span>
          </div>
          <p className="text-xs text-slate-400">{t('calc.formulaColumnTotalLinks')}</p>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.linksOverallTotalLabel')}</span>
            <span className="text-base font-black text-amber-800">{formatNumber(getLinksOverallTotal(result), 2)} m</span>
          </div>
          <p className="text-xs text-slate-400">{t('calc.formulaColumnOverallLinks')}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full py-4 rounded-2xl font-black active:scale-95 transition-transform ${
            canSave ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span className="inline-flex items-center gap-2"><Save size={18} /> {t('common.save')}</span>
        </button>
      </section>
    );
  };

  return (
    <div className="p-5 space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <header className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">{mode === 'main-bars' ? t('calc.mainBars') : t('calc.links')}</h2>
            <p className="text-xs text-slate-400">{t('calc.column.subtitle')}</p>
          </div>
        </header>

        {renderInputs()}

        <SaveMetaFields
          variant="qm"
          projectLocation={projectLocation}
          referenceRemark={referenceRemark}
          onProjectLocationChange={setProjectLocation}
          onReferenceRemarkChange={setReferenceRemark}
        />

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-6 w-full py-4 rounded-2xl bg-blue-600 text-white font-black active:scale-95 transition-transform"
        >
          {t('common.calculate')}
        </button>
      </section>

      {renderResultCard()}

      <PageSavedHistorySection
        type="column"
        contextKey={mode === 'main-bars' ? 'column-main-bars' : 'column-link'}
        refreshKey={historyRefreshKey}
        onReuse={handleReuse}
      />
    </div>
  );
};

export default ColumnView;
