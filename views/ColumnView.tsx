import React, { useMemo, useState } from 'react';
import { Calculator, Grid3X3, Save } from 'lucide-react';
import { calcColumnQM, type ColumnInputs, type ColumnQMResult } from '../src/lib/qm';
import { saveResultRemote } from '../services/historyService';
import { getFieldState } from '../lib/fieldState';
import QMField from '../components/QMField';
import { useI18n } from '../src/i18n/I18nContext';
import { formatSupabaseError } from '../lib/formatSupabaseError';
import { useFeedback } from '../contexts/FeedbackContext';

type ColumnMode = 'main-bars' | 'links' | 'total';

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
};

const formatNumber = (value: number | null | undefined, decimals: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
};

const parseNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const ColumnView: React.FC<ColumnViewProps> = ({ mode }) => {
  const { t } = useI18n();
  const [form, setForm] = useState<ColumnForm>(initialForm);
  const [touched, setTouched] = useState({
    a: false,
    b: false,
    H: false,
    n: false,
    C: false,
    c: false,
    d: false,
    spacing: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ColumnQMResult | null>(null);
  const [saving, setSaving] = useState(false);
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
  };

  const hasErrors = Object.values(errors).some((err) => !!err);

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

  const computeResult = () => {
    setSubmitted(true);
    if (hasErrors) {
      setResult(null);
      return null;
    }
    const inputs = buildInputs();
    const next = calcColumnQM(inputs);
    setResult(next);
    return { inputs, result: next };
  };

  const handleCalculate = () => {
    const computed = computeResult();
    if (!computed) {
      showValidation();
    }
  };

  const getSaveConfig = (output: ColumnQMResult) => {
    if (mode === 'main-bars') {
      return {
        label: 'Column Main Bars',
        outputs: {
          main_bars_m: output.main_bars_m,
        },
        result: output.main_bars_m,
      };
    }

    if (mode === 'links') {
      return {
        label: 'Column Links',
        outputs: {
          link_length_m: output.link_length_m,
          links_qty: output.links_qty,
          links_total_m: output.links_total_m,
        },
        result: output.links_total_m,
      };
    }

    return {
      label: 'Column Total',
      outputs: {
        concrete_m3: output.concrete_m3,
        formwork_m2: output.formwork_m2,
        main_bars_m: output.main_bars_m,
        links_total_m: output.links_total_m,
        column_total_m: output.column_total_m,
      },
      result: output.column_total_m,
    };
  };

  const handleSave = async () => {
    const computed = computeResult();
    const valueToSave =
      mode === 'main-bars'
        ? computed?.result.main_bars_m ?? 0
        : mode === 'links'
          ? computed?.result.links_total_m ?? 0
          : computed?.result.column_total_m ?? 0;

    if (!computed || valueToSave <= 0) {
      showValidation();
      return;
    }

    setSaving(true);
    try {
      const { inputs, result: output } = computed;
      const saveConfig = getSaveConfig(output);

      await saveResultRemote({
        type: 'column',
        label: saveConfig.label,
        inputs: {
          a_m: inputs.a,
          b_m: inputs.b,
          H_m: inputs.H,
          n: inputs.n,
          C_m: inputs.C,
          c_m: inputs.c,
          d_mm: inputs.d,
          spacing_m: inputs.spacing,
        },
        outputs: saveConfig.outputs,
        result: saveConfig.result,
        unit: 'm',
      });
      showSuccess(t('modal.saveSuccessTitle'), t('modal.saveSuccessMsg'));
    } catch (err: any) {
      const reason = formatSupabaseError(err, t('common.errorTryAgain'));
      showError(t('modal.saveFailTitle'), t('modal.saveFailMsg', { error: reason }));
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    !!result &&
    (
      (mode === 'main-bars' && result.main_bars_m > 0) ||
      (mode === 'links' && result.links_total_m > 0) ||
      (mode === 'total' && result.column_total_m > 0)
    ) &&
    !saving;

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
        </div>
      );
    }

    if (mode === 'links') {
      return (
        <div className="space-y-4">
          {renderField('a', t('calc.column.sideALabel'), 'm')}
          {renderField('b', t('calc.column.sideBLabel'), 'm')}
          {renderField('H', t('calc.column.heightHLabel'), 'm')}
          {renderField('c', t('calc.linkCoverLabel'), 'm')}
          {renderField('d', t('calc.linkDiameterLabel'), 'mm')}
          {renderField('spacing', t('calc.spacingLabel'), 'm')}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('calc.columnGeometry')}</h3>
          {renderField('a', t('calc.column.sideALabel'), 'm')}
          {renderField('b', t('calc.column.sideBLabel'), 'm')}
          {renderField('H', t('calc.column.heightHLabel'), 'm')}
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('calc.mainBars')}</h3>
          {renderField('n', t('calc.mainBarsCountLabel'), t('common.barsUnit'), { step: '1', inputMode: 'numeric' })}
          {renderField('C', t('calc.mainBarsDeductionLabel'), 'm')}
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('calc.links')}</h3>
          {renderField('c', t('calc.linkCoverLabel'), 'm')}
          {renderField('d', t('calc.linkDiameterLabel'), 'mm')}
          {renderField('spacing', t('calc.spacingLabel'), 'm')}
        </div>
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
          <div className="text-2xl font-black text-orange-600">
            {formatNumber(result?.main_bars_m ?? null, 2)} m
          </div>
          <p className="text-xs text-slate-400">{t('calc.formulaColumnSteelMain')}</p>
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

    if (mode === 'links') {
      return (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Grid3X3 size={16} className="text-amber-500" />
            {t('calc.links')}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>{t('calc.linkLengthLabel')}</span>
              <span className="text-base font-black text-amber-600">{formatNumber(result?.link_length_m ?? null, 2)} m</span>
            </div>
            <p className="text-xs text-slate-400">{t('calc.formulaColumnSteelLinks')}</p>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>{t('calc.linksQtyLabel')}</span>
              <span className="text-base font-black text-amber-600">{formatNumber(result?.links_qty ?? null, 2)}</span>
            </div>
            <p className="text-xs text-slate-400">{t('calc.formulaColumnLinksQty')}</p>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>{t('calc.totalLinksLabel')}</span>
              <span className="text-base font-black text-amber-700">{formatNumber(result?.links_total_m ?? null, 2)} m</span>
            </div>
            <p className="text-xs text-slate-400">{t('calc.formulaColumnTotalLinks')}</p>
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
          <Calculator size={16} className="text-slate-600" />
          {t('calc.totalColumn')}
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.concreteTitle')}</span>
            <span>{formatNumber(result?.concrete_m3 ?? null, 3)} m3</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.formworkTitle')}</span>
            <span>{formatNumber(result?.formwork_m2 ?? null, 3)} m2</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.mainBarsLabel')}</span>
            <span>{formatNumber(result?.main_bars_m ?? null, 2)} m</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{t('calc.linksLabel')}</span>
            <span>{formatNumber(result?.links_total_m ?? null, 2)} m</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-sm font-bold text-slate-800">
            <span>{t('calc.reinforcementTotalLabel')}</span>
            <span className="text-lg font-black text-slate-900">
              {formatNumber(result?.column_total_m ?? null, 2)} m
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">{t('calc.formulaColumnReinforcementTotal')}</p>
        <p className="text-xs text-slate-400">{t('calc.totalColumnNote')}</p>
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
            <h2 className="font-bold text-slate-800">
              {mode === 'main-bars'
                ? t('calc.mainBars')
                : mode === 'links'
                  ? t('calc.links')
                  : t('calc.totalColumn')}
            </h2>
            <p className="text-xs text-slate-400">{t('calc.column.subtitle')}</p>
          </div>
        </header>

        {renderInputs()}

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-6 w-full py-4 rounded-2xl bg-blue-600 text-white font-black active:scale-95 transition-transform"
        >
          {t('common.calculate')}
        </button>
      </section>

      {renderResultCard()}
    </div>
  );
};

export default ColumnView;
